#pragma once
#include <string>
#include <windows.h>

namespace SmartReply {

class ClipboardHook {
public:
    // Read current text from Windows clipboard
    static std::string GetClipboardText();

    // Set text to Windows clipboard
    static bool SetClipboardText(const std::string& text);

    // Send Ctrl+C keystroke to active foreground window and capture selected text
    static std::string CaptureSelectedText(HWND targetWnd);

    // Paste text into active window by setting clipboard and simulating Ctrl+V
    static bool InjectText(HWND targetWnd, const std::string& text);

    // Save and restore previous clipboard content
    static void RestoreClipboard(const std::string& previousText);
};

} // namespace SmartReply
