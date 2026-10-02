#include "clipboard_hook.h"
#include <vector>
#include <iostream>

namespace SmartReply {

std::string ClipboardHook::GetClipboardText() {
    if (!OpenClipboard(nullptr)) return "";

    HANDLE hData = GetClipboardData(CF_UNICODETEXT);
    if (!hData) {
        CloseClipboard();
        return "";
    }

    auto* wideText = static_cast<wchar_t*>(GlobalLock(hData));
    std::string text;
    if (wideText) {
        // Convert UTF-16 clipboard contents to UTF-8 for the rest of the app.
        int utf8Length = WideCharToMultiByte(CP_UTF8, 0, wideText, -1, nullptr, 0, nullptr, nullptr);
        if (utf8Length > 1) {
            text.resize(static_cast<size_t>(utf8Length - 1));
            WideCharToMultiByte(CP_UTF8, 0, wideText, -1, text.data(), utf8Length, nullptr, nullptr);
        }
        GlobalUnlock(hData);
    }
    CloseClipboard();

    return text;
}

bool ClipboardHook::SetClipboardText(const std::string& text) {
    if (!OpenClipboard(nullptr)) return false;

    // Convert UTF-8 to UTF-16 so emoji and non-Latin scripts survive paste.
    int wideLength = MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, nullptr, 0);
    if (wideLength <= 0) {
        CloseClipboard();
        return false;
    }

    HGLOBAL hGlob = GlobalAlloc(GMEM_MOVEABLE, static_cast<size_t>(wideLength) * sizeof(wchar_t));
    if (!hGlob) {
        CloseClipboard();
        return false;
    }

    auto* wideBuffer = static_cast<wchar_t*>(GlobalLock(hGlob));
    if (!wideBuffer) {
        GlobalFree(hGlob);
        CloseClipboard();
        return false;
    }
    MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, wideBuffer, wideLength);
    GlobalUnlock(hGlob);

    EmptyClipboard();
    if (!SetClipboardData(CF_UNICODETEXT, hGlob)) {
        GlobalFree(hGlob);
        CloseClipboard();
        return false;
    }
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

    // Put the user's clipboard back the way we found it.
    RestoreClipboard(previousClipboard);

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
