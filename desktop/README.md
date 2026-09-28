# Smart Reply AI — Native Windows Desktop (C++)

A high-performance, native Windows C++ desktop assistant with zero runtime dependencies.

## Key Features

- **Ultra-Lightweight Footprint:** $< 2\text{ MB}$ single executable, $< 15\text{ MB}$ RAM idle.
- **Global Hotkey (`Ctrl + Shift + R`):** Works across all Windows applications (Slack, Discord, Outlook, Word, WhatsApp, Telegram, browsers).
- **Floating Overlay:** Frameless, dark-mode pill positioned near the cursor with 4 instant suggestions.
- **Auto-Paste (`SendInput`):** Clicking any suggestion automatically injects the text into the active focused field.
- **Zero-Latency Heuristics Engine:** Instant on-device pattern matching ($< 1\text{ ms}$).
- **WinINet Universal Cloud Client:** Native HTTPS requests to OpenAI, Groq, OpenRouter, or Ollama (`http://localhost:11434/v1`) without requiring external DLLs.
- **System Tray Integration:** Runs quietly in the notification area with full control over operating modes.

## Directory Structure

```
desktop/
├── CMakeLists.txt        # CMake build configuration
├── build.bat             # One-click Windows build script
├── include/
│   ├── app_config.h      # Application state & provider structures
│   ├── clipboard_hook.h  # Windows clipboard hook & keystroke simulator
│   ├── heuristic_engine.h# Sub-millisecond on-device heuristic engine
│   ├── cloud_client.h    # Native WinINet HTTP client
│   ├── tray_manager.h    # Shell_NotifyIcon tray integration
│   └── floating_window.h # Dark-mode GDI+ floating suggestion UI
└── src/
    ├── main.cpp          # WinMain entry point & hotkey loop
    ├── clipboard_hook.cpp
    ├── heuristic_engine.cpp
    ├── cloud_client.cpp
    ├── tray_manager.cpp
    └── floating_window.cpp
```

## How to Build

### Option 1: One-Click Build Script
Open **Developer Command Prompt for Visual Studio** (or MinGW terminal) and run:
```bat
build.bat
```
The compiled executable will be placed in `bin/SmartReplyAI.exe`.

### Option 2: CMake
```bash
cmake -B build
cmake --build build --config Release
```

## How to Use
1. Launch `SmartReplyAI.exe`. It will place an icon in the Windows System Tray and display a notification.
2. Open any app (e.g. Notepad, Discord, Gmail, Slack).
3. Select any incoming message or copy text to clipboard.
4. Press `Ctrl + Shift + R`.
5. The floating suggestion overlay will appear next to your cursor.
6. Click any suggestion: it will automatically copy and paste into your target active window!
