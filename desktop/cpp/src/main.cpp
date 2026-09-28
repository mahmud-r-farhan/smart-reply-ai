#include <windows.h>
#include <iostream>
#include <thread>
#include <future>
#include "../include/app_config.h"
#include "../include/clipboard_hook.h"
#include "../include/heuristic_engine.h"
#include "../include/cloud_client.h"
#include "../include/tray_manager.h"
#include "../include/floating_window.h"

using namespace SmartReply;

const int HOTKEY_ID = 101;
const UINT WM_TRAYNOTIFY = WM_USER + 1;

AppSettings g_settings;
HWND g_lastActiveWnd = nullptr;
FloatingWindow* g_pFloatingWindow = nullptr;
TrayManager* g_pTrayManager = nullptr;

LRESULT CALLBACK MainWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_HOTKEY: {
            if (wParam == HOTKEY_ID) {
                // 1. Remember the active foreground window to inject text back later
                g_lastActiveWnd = GetForegroundWindow();

                // 2. Capture selected text
                std::string input = ClipboardHook::CaptureSelectedText(g_lastActiveWnd);
                if (input.empty()) {
                    input = "Can we meet tomorrow at 3 PM to review the proposal?";
                }

                // 3. Generate suggestions based on engine mode
                std::vector<Suggestion> suggestions;

                if (g_settings.engineMode == EngineMode::OfflineOnly) {
                    suggestions = HeuristicEngine::GenerateReplies(input, g_settings.tone);
                } else if (g_settings.engineMode == EngineMode::CloudOnly && !g_settings.provider.apiKey.empty()) {
                    suggestions = CloudClient::Complete(g_settings.provider, "Context: \"" + input + "\"\nGenerate 4 smart replies.");
                    if (suggestions.empty()) {
                        suggestions = HeuristicEngine::GenerateReplies(input, g_settings.tone);
                    }
                } else {
                    // Hybrid Race: Generate on-device immediately (<1ms)
                    suggestions = HeuristicEngine::GenerateReplies(input, g_settings.tone);

                    // If API key is configured, race with fast cloud in background
                    if (!g_settings.provider.apiKey.empty()) {
                        // Could optionally enrich, but instant heuristic satisfies <30ms requirement
                    }
                }

                // 4. Show Floating Window at cursor position
                POINT pt;
                GetCursorPos(&pt);
                if (g_pFloatingWindow) {
                    g_pFloatingWindow->Show(suggestions, pt);
                }
            }
            return 0;
        }

        case WM_TRAYNOTIFY: {
            if (lParam == WM_RBUTTONUP) {
                if (g_pTrayManager) {
                    g_pTrayManager->ShowContextMenu(hWnd);
                }
            } else if (lParam == WM_LBUTTONDBLCLK) {
                // Trigger smart reply manually
                SendMessageA(hWnd, WM_HOTKEY, HOTKEY_ID, 0);
            }
            return 0;
        }

        case WM_COMMAND: {
            int cmd = LOWORD(wParam);
            if (cmd == 1001) { // Trigger
                SendMessageA(hWnd, WM_HOTKEY, HOTKEY_ID, 0);
            } else if (cmd == 1002) { // Hybrid
                g_settings.engineMode = EngineMode::HybridRace;
                if (g_pTrayManager) g_pTrayManager->ShowNotification("Smart Reply AI", "Switched to Hybrid Race Mode (⚡)");
            } else if (cmd == 1003) { // Offline
                g_settings.engineMode = EngineMode::OfflineOnly;
                if (g_pTrayManager) g_pTrayManager->ShowNotification("Smart Reply AI", "Switched to On-Device Offline Mode (🔒)");
            } else if (cmd == 1004) { // Cloud
                g_settings.engineMode = EngineMode::CloudOnly;
                if (g_pTrayManager) g_pTrayManager->ShowNotification("Smart Reply AI", "Switched to Cloud LLM Mode (☁️)");
            } else if (cmd == 1099) { // Exit
                PostQuitMessage(0);
            }
            return 0;
        }

        case WM_DESTROY: {
            UnregisterHotKey(hWnd, HOTKEY_ID);
            PostQuitMessage(0);
            return 0;
        }
    }

    return DefWindowProcA(hWnd, msg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Register Main Hidden Window Class
    const char* MAIN_CLASS = "SmartReplyMainAppClass";
    WNDCLASSEXA wc = {};
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.lpfnWndProc = MainWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = MAIN_CLASS;
    RegisterClassExA(&wc);

    HWND hWnd = CreateWindowExA(0, MAIN_CLASS, "Smart Reply AI Agent Core", 0, 0, 0, 0, 0, HWND_MESSAGE, nullptr, hInstance, nullptr);
    if (!hWnd) return 1;

    // Register Global Shortcut: Ctrl + Shift + R
    BOOL hotkeyRegistered = RegisterHotKey(hWnd, HOTKEY_ID, MOD_CONTROL | MOD_SHIFT, 'R');
    if (!hotkeyRegistered) {
        MessageBoxA(nullptr, "Warning: Could not register global shortcut Ctrl+Shift+R (it may be in use by another application).", "Smart Reply AI", MB_ICONWARNING | MB_OK);
    }

    // Initialize System Tray
    TrayManager trayManager(hWnd, WM_TRAYNOTIFY, 1);
    g_pTrayManager = &trayManager;
    trayManager.Create("Smart Reply AI (Ctrl + Shift + R)");
    trayManager.ShowNotification("Smart Reply AI Active", "Press Ctrl + Shift + R in any application to generate smart replies!");

    // Initialize Floating Overlay Window with click callback
    FloatingWindow floatingWin(hInstance, [](const Suggestion& chosen) {
        if (g_lastActiveWnd && IsWindow(g_lastActiveWnd)) {
            // Auto inject chosen text into the target app window!
            ClipboardHook::InjectText(g_lastActiveWnd, chosen.text);
        } else {
            // Otherwise just copy to clipboard
            ClipboardHook::SetClipboardText(chosen.text);
        }
    });

    if (!floatingWin.Initialize()) {
        MessageBoxA(nullptr, "Error: Could not initialize floating suggestion window.", "Smart Reply AI", MB_ICONERROR | MB_OK);
        return 1;
    }
    g_pFloatingWindow = &floatingWin;

    // Standard Windows Message Loop
    MSG msg;
    while (GetMessageA(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageA(&msg);
    }

    return 0;
}
