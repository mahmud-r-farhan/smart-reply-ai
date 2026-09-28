# Smart Reply AI — Native Desktop Support

Smart Reply AI provides two native desktop solutions:

1. **[Native C++ Windows Desktop (`desktop/cpp/`)](cpp/README.md)**:
   - **Footprint:** Single standalone executable $< 2\text{ MB}$, $< 15\text{ MB}$ RAM idle.
   - **Zero External Dependencies:** Built with pure Win32 APIs, GDI+, and native WinINet HTTPS client. Runs on any Windows 10/11 machine out of the box without requiring webview or node runtimes.
   - **OS Hotkey & Injection:** Listens to `Ctrl + Shift + R`, displays a floating overlay near cursor, and auto-pastes chosen suggestion into active foreground app via `SendInput`.
   - **Build:** `build.bat` or CMake.

2. **[Tauri v2 + Rust Desktop (`desktop/rust/`)](rust/README.md)**:
   - Modern, cross-platform architecture adhering to Section 3.1 of `project_blueprint_ai_agent_specification.md`.
   - Uses Rust bindings, system tray, global shortcuts, and shared React UI.
   - **Build:** `cargo tauri build`.
