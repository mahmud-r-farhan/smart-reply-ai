#include <windows.h>
#include <iostream>
#include <thread>
#include <vector>
#include <future>
#include "app_config.h"
#include "clipboard_hook.h"
#include "heuristic_engine.h"
#include "cloud_client.h"
#include "tray_manager.h"
#include "floating_window.h"

using namespace SmartReply;

const int HOTKEY_ID = 101;
const UINT WM_TRAYNOTIFY = WM_USER + 1;
const UINT WM_CLOUD_RESULT = WM_USER + 2; // posted by the cloud worker thread

AppSettings g_settings;
HWND g_lastActiveWnd = nullptr;
HWND g_mainWnd = nullptr;
FloatingWindow* g_pFloatingWindow = nullptr;
TrayManager* g_pTrayManager = nullptr;

/// Bumped for every cloud request. Results carrying an older generation are
/// dropped, so a slow reply to a previous selection can never overwrite the
/// suggestions for the text the user asked about most recently.
LONG g_cloudGeneration = 0;

struct CloudResultPayload {
    std::vector<Suggestion> suggestions;
    LONG generation{ 0 };
};

/**
 * Fire-and-forget cloud upgrade. Runs the network call on a worker thread and
 * posts the answer back to the UI thread as WM_CLOUD_RESULT, so the overlay
 * never freezes and the on-device suggestions stay instant.
 */
static void StartCloudUpgrade(const std::string& input) {
    ProviderConfig providerCopy = g_settings.provider;
    std::string cloudPrompt = "Context: \"" + input + "\"\nGenerate 4 smart replies.";
    const LONG generation = InterlockedIncrement(&g_cloudGeneration);

    std::thread([providerCopy, cloudPrompt, generation]() {
        std::vector<Suggestion> cloudSuggestions =
            CloudClient::Complete(providerCopy, cloudPrompt);
        if (cloudSuggestions.empty() || !IsWindow(g_mainWnd)) return;

        auto* payload = new CloudResultPayload{ std::move(cloudSuggestions), generation };
        if (!PostMessageA(g_mainWnd, WM_CLOUD_RESULT, 0, reinterpret_cast<LPARAM>(payload))) {
            delete payload; // window already gone
        }
    }).detach();
}

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
                    // Never block the message loop on a 6-second network call:
                    // show the instant on-device answer and upgrade it in place
                    // when the cloud worker posts WM_CLOUD_RESULT back.
                    suggestions = HeuristicEngine::GenerateReplies(input, g_settings.tone);
                    StartCloudUpgrade(input);
                } else {
                    // Hybrid Race: Generate on-device immediately (<1ms)
                    suggestions = HeuristicEngine::GenerateReplies(input, g_settings.tone);

                    // Hybrid Race: upgrade the instant on-device answer with the
                    // cloud result as soon as the worker thread delivers it.
                    if (!g_settings.provider.apiKey.empty()) {
                        StartCloudUpgrade(input);
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

        case WM_CLOUD_RESULT: {
            auto* payload = reinterpret_cast<CloudResultPayload*>(lParam);
            if (payload) {
                // Ignore replies that belong to an older request.
                if (payload->generation == g_cloudGeneration && g_pFloatingWindow) {
                    POINT pt;
                    GetCursorPos(&pt);
                    g_pFloatingWindow->Show(payload->suggestions, pt);
                }
                delete payload;
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
    UNREFERENCED_PARAMETER(hPrevInstance);
    UNREFERENCED_PARAMETER(lpCmdLine);
    UNREFERENCED_PARAMETER(nCmdShow);

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
    g_mainWnd = hWnd;

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
