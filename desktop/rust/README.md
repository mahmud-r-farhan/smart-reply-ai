# Smart Reply AI — Tauri v2 + Rust Desktop

A modern, high-performance cross-platform desktop application built with **Tauri v2** and **Rust**.

## Architecture

- **Core Shell:** Tauri v2 (Rust).
- **Global Hotkey:** `Ctrl + Shift + R` via `tauri-plugin-global-shortcut`.
- **System Tray:** Tray icon with minimize to tray, mode toggle, and exit actions.
- **On-Device Heuristics:** Sub-millisecond rule matching implemented in native Rust.
- **Universal Cloud LLM:** Asynchronous `reqwest` client for Groq, OpenRouter, and Ollama (`http://localhost:11434/v1`).
- **Frontend UI:** Reuses the high-performance React 19 + Tailwind CSS frontend (`frontend/`).

## How to Run

1. Ensure [Rust](https://rustup.rs/) is installed on your machine (`cargo --version`).
2. Install Tauri CLI:
   ```bash
   cargo install tauri-cli --version "^2.0.0"
   ```
3. Run in development mode:
   ```bash
   cargo tauri dev
   ```
4. Build release installer:
   ```bash
   cargo tauri build
   ```
The generated Windows installer (`.msi` / `.exe`) will be output to `src-tauri/target/release/bundle/`.
