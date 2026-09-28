#include "../include/clipboard_hook.h"
#include <vector>
#include <iostream>

namespace SmartReply {

std::string ClipboardHook::GetClipboardText() {
    if (!OpenClipboard(nullptr)) return "";

    HANDLE hData = GetClipboardData(CF_TEXT);
    if (!hData) {
        CloseClipboard();
        return "";
    }

    char* pszText = static_cast<char*>(GlobalLock(hData));
    std::string text = (pszText ? pszText : "");
    GlobalUnlock(hData);
    CloseClipboard();

    return text;
}

bool ClipboardHook::SetClipboardText(const std::string& text) {
    if (!OpenClipboard(nullptr)) return false;

    EmptyClipboard();
    HGLOBAL hGlob = GlobalAlloc(GMEM_MOVEABLE, text.size() + 1);
    if (!hGlob) {
        CloseClipboard();
        return false;
    }

    memcpy(GlobalLock(hGlob), text.c_str(), text.size() + 1);
    GlobalUnlock(hGlob);

    SetClipboardData(CF_TEXT, hGlob);
    CloseClipboard();
    return true;
}

std::string ClipboardHook::CaptureSelectedText(HWND targetWnd) {
    std::string previousClipboard = GetClipboardText();

    // Clear clipboard so we can detect if fresh text was copied
    if (OpenClipboard(nullptr)) {
        EmptyClipboard();
        CloseClipboard();
    }

    // Bring target window to foreground
    if (targetWnd && IsWindow(targetWnd)) {
        SetForegroundWindow(targetWnd);
    }
    Sleep(50);

    // Simulate Ctrl + C to copy selection
    INPUT inputs[4] = {};
    // Ctrl Down
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    // C Down
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'C';
    // C Up
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'C';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    // Ctrl Up
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(4, inputs, sizeof(INPUT));
    Sleep(120); // Allow OS clipboard propagation

    std::string selectedText = GetClipboardText();

    // If nothing was selected, fall back to previous clipboard
    if (selectedText.empty()) {
        selectedText = previousClipboard;
    }

    return selectedText;
}

bool ClipboardHook::InjectText(HWND targetWnd, const std::string& text) {
    if (text.empty()) return false;

    // Set text to clipboard
    if (!SetClipboardText(text)) return false;

    if (targetWnd && IsWindow(targetWnd)) {
        SetForegroundWindow(targetWnd);
        Sleep(60);
    }

    // Simulate Ctrl + V to paste
    INPUT inputs[4] = {};
    // Ctrl Down
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    // V Down
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'V';
    // V Up
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'V';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    // Ctrl Up
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(4, inputs, sizeof(INPUT));
    return true;
}

void ClipboardHook::RestoreClipboard(const std::string& previousText) {
    if (!previousText.empty()) {
        SetClipboardText(previousText);
    }
}

} // namespace SmartReply
