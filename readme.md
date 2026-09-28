# Smart Reply AI — Universal Assistant Suite

> High-performance, cross-platform productivity ecosystem capable of seamless **Zero-Latency Offline Heuristics / On-Device ML** and **Universal OpenAI-Compatible Cloud LLM Orchestration** (Groq, OpenRouter, Ollama, OpenAI).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-smart--reply--delta.vercel.app-blue?style=flat-square)](https://smart-reply-delta.vercel.app)
[![Stars](https://img.shields.io/github/stars/mahmud-r-farhan/smart-reply?style=flat-square)](https://github.com/mahmud-r-farhan/smart-reply/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![897.webp](https://i.postimg.cc/Dwb20cKP/897.webp)](https://postimg.cc/gxm9B8jx)

---

## Table of Contents

- [Overview](#overview)
- [Four Core Productivity Modes](#four-core-productivity-modes)
- [Unified Multi-Engine Architecture](#unified-multi-engine-architecture)
- [Key Features](#key-features)
- [Tech Stack & Modular Architecture](#tech-stack--modular-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Web Frontend Setup](#web-frontend-setup)
  - [Flutter Mobile App Setup](#flutter-mobile-app-setup)
  - [Browser Extension Setup](#browser-extension-setup)
- [API Reference](#api-reference)
- [Caching & Zero-Latency Performance](#caching--zero-latency-performance)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Smart Reply AI** is an enterprise-grade, privacy-first AI productivity suite built to boost communication speed and text quality. Whether you're handling repetitive client tickets, drafting executive emails, translating cross-border messages, or distilling complex threads, Smart Reply AI delivers instant results.

It runs across four interconnected platforms:
1. **React 19 Web App (PWA):** Zero-latency browser heuristics, client-side BYOK OpenAI engine, animated Framer Motion interface.
2. **Flutter Mobile App (Android/iOS):** Ultra-modular widget architecture, on-device rules engine (< 5ms), direct universal cloud LLMs (Groq, OpenRouter, Ollama), and hybrid race dispatcher.
3. **Chrome / Edge Extension (Manifest V3):** Injectable suggestions, context menus, offline heuristics fallback, and direct cloud API integration.
4. **Universal Node.js Express Backend:** SHA-256 caching, rate limiting, and unified `/v1/chat/completions` proxy with deterministic fallback.

---

## Four Core Productivity Modes

Aligned with Google ML Kit smart reply, proofreading, rewriting, and summarization specifications:

| Mode | Specification | What it does |
|---|---|---|
| **Smart Reply** | ML Kit Smart Reply | Generates up to 4 context-aware, tone-tailored responses to received messages |
| **Smart Enhance** | ML Kit Proofreading & Rewriting | Rewrites text for grammar, structure, tone, clarity, and conciseness |
| **Smart Translate** | ML Kit Translation | Translates text into target languages with stylistic variation |
| **Smart Summarize** | ML Kit GenAI Summarization | Distills long messages, emails, and notes into executive takeaways and action bullets |

---

## Unified Multi-Engine Architecture

Smart Reply AI solves the "Native vs Cloud" dilemma through a **Unified Multi-Engine Strategy**:

```text
                                  +---------------------------------------+
                                  |       Application Presentation        |
                                  |  (Native C++/Rust, Flutter, Web, Ext) |
                                  +---------------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        Hybrid Dispatcher Core         |
                                  | (Modes: Hybrid-Race | Offline | Cloud)|
                                  +---------------------------------------+
                                          /                       \
                     [Offline Mode / Latency Sensitive]     [Deep Reasoning / High Context]
                                        /                           \
                                       v                             v
                     +----------------------------------+   +----------------------------------+
                     |    Local On-Device Subsystem     |   |    Universal Cloud Subsystem     |
                     +----------------------------------+   +----------------------------------+
                     | - Zero-latency Rule Heuristics   |   | - Groq LPU (llama-3.1-8b-instant)|
                     | - Native C++ Win32 & Rust Core   |   | - OpenRouter (Llama 3.3 70B)     |
                     | - Google ML Kit Android SDK      |   | - Ollama (Local on-device LAN)   |
                     | - Client-side phrasebook dict    |   | - Protocol: OpenAI-compatible API|
                     | - Offline execution (<5ms)       |   |                                  |
                     +----------------------------------+   +----------------------------------+
```

### Supported Operating Modes:
* **Hybrid Race (Default):** Runs local on-device heuristics instantaneously. Simultaneously queries ultra-fast cloud LLM (e.g. Groq) with a race timeout. If cloud responds within the window, it enriches the result; otherwise, user receives instant offline suggestions with zero perceived latency.
* **On-Device Offline Only:** 100% private, zero network requests, zero data egress, executes in $< 5\text{ ms}$.
* **Cloud LLM Only:** Maximum reasoning capacity for nuanced tone transformations.
* **Smart Fallback:** Primary cloud LLM with instantaneous fallback to on-device rules on any network disruption.

---

## Key Features

- **Native Desktop Support (C++ & Rust):** Standalone $< 2\text{ MB}$ native Windows C++ app + Tauri v2 Rust desktop shell with global hotkey (`Ctrl + Shift + R`) and direct window injection.
- **Multi-Cloud Universal Adapter:** Works out of the box with **Groq**, **OpenRouter**, **Ollama (`http://localhost:11434/v1`)**, **OpenAI**, and custom endpoints.
- **Privacy-First (BYOK):** API keys are stored locally on user devices (via encrypted storage / `localStorage`). Never transmitted to intermediate proxy servers.
- **Zero-Latency Offline Fallback:** If internet is cut or no API key is provided, the deterministic heuristics engine guarantees instant responses.
- **7 Tones & Response Styles:** Professional, Friendly, Casual, Concise, Formal, Flirty, and Romantic.
- **Multi-Language Translation:** Spanish, French, German, Bengali, Japanese, Chinese, Arabic, Portuguese, Italian, Hindi, and English.
- **Telemetry & Provenance Badges:** Live badges showing exact latency (`⚡ On-Device 3ms` vs `☁️ Cloud 260ms`) and generating model.
- **Modular Component Design:** Granular, single-responsibility widgets and components for high maintainability.

---

## Tech Stack & Modular Architecture

```
smart-reply/
├── desktop/              # Native Win32 C++ Desktop App (<2MB standalone, SendInput injection, tray)
│   ├── CMakeLists.txt    # Modern CMake build configuration
│   ├── build.bat         # One-click Windows build script
│   ├── include/          # Modular headers (clipboard, cloud, floating window, tray)
│   └── src/              # Win32 GDI+ UI, WinINet cloud client, heuristic engine
├── backend/
│   ├── controllers/      # suggestReply, enhanceText, translateText, summarizeText
│   ├── services/         # universalLlmService (OpenAI protocol), heuristicEngine
│   ├── utils/            # cacheManager (SHA-256), modelSelector, rateLimiter
│   └── server.js         # Express server with security headers & compression
├── frontend/
│   ├── src/components/   # EngineModeSelector, ProviderModal, LatencyBadge, InputSection...
│   ├── src/store/        # useChatStore (Zustand state + client-side hybrid dispatcher)
│   ├── src/utils/        # heuristicEngine (client-side JS), universalCloudEngine
│   └── App.jsx           # Clean, modular reactive interface
├── extension/
│   ├── background.js     # Service worker with multi-engine cloud + heuristic fallback
│   ├── popup.html        # Clean, modern UI with mode tabs and settings view
│   ├── popup.js          # Modular event controller and storage manager
│   └── content.js        # Active editable field text inserter
└── smart_reply_app/      # Production Flutter Application
    ├── lib/models/       # engine_mode, provider_config, reply_suggestion, chat_message
    ├── lib/services/     # heuristic_engine, cloud_llm_engine, hybrid_dispatcher, settings_storage
    ├── lib/providers/    # chat_provider (ChangeNotifier)
    ├── lib/widgets/      # modular components: common, selectors, input, results, dialogs
    └── lib/screens/      # home_screen (clean composed architecture)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and [npm](https://www.npmjs.com/) v9+
- [Flutter SDK](https://flutter.dev/docs/get-started/install) v3.10+ (for mobile app)

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:5006`. *(Note: An API key in `.env` is optional; if none is provided, the backend automatically uses its built-in zero-latency heuristic engine!)*

---

### Web Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. You can configure your Groq, OpenRouter, or Ollama provider directly in the UI via the **"Configure AI Model"** modal.

To build the production bundle:
```bash
npm run build
```

---

### Flutter Mobile App Setup

```bash
cd smart_reply_app
flutter pub get
flutter run
```

To verify code quality and lints:
```bash
flutter analyze
```

---

### Browser Extension Setup

1. Open Chrome/Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory.
4. Pin the extension to test instant smart replies, translations, and text insertions.

---

### Native Windows Desktop Setup (`desktop/`)

Smart Reply AI provides a standalone native Windows C++ assistant in `desktop/`:
* **Binary footprint:** $< 2\text{ MB}$, $< 15\text{ MB}$ RAM idle, zero runtime dependencies.
* **Global Hotkey:** `Ctrl + Shift + R` invokes a floating suggestion overlay in any Windows app.
* **Direct Auto-Paste:** Clicking a suggestion automatically injects the text into your active target window via `SendInput`.
* **To Build:**
  ```cmd
  cd desktop
  build.bat
  ```
  *(Or run `cmake -B build && cmake --build build --config Release`)*

---

## API Reference

All endpoints accept and return JSON.

### 1. `POST /api/suggest-reply`
Generates up to 4 context-aware reply suggestions.
```json
{
  "message": "Can we sync tomorrow at 3 PM?",
  "format": "professional",
  "providerConfig": {
    "baseURL": "https://api.groq.com/openai/v1",
    "apiKey": "gsk_...",
    "model": "llama-3.1-8b-instant"
  }
}
```

### 2. `POST /api/enhance-text`
Rewrites and polishes text across grammar, structure, and tone.
```json
{
  "text": "we need to talk about the budget problem asap",
  "format": "friendly"
}
```

### 3. `POST /api/translate-text`
Translates text into target language with style variations.
```json
{
  "text": "Thank you for the update!",
  "language": "spanish",
  "format": "professional"
}
```

### 4. `POST /api/summarize-text`
Summarizes text into key takeaways, bullets, and executive recap.
```json
{
  "text": "Meeting notes: Team finalized backend migration. Customer satisfaction increased 14%. Next sprint targets on-device ML caching.",
  "format": "concise"
}
```

### 5. `GET /api/providers`
Discovers supported cloud provider presets, model IDs, and format options.

---

## Caching & Zero-Latency Performance

- **SHA-256 Cache:** The backend and clients hash prompt and model parameters to prevent redundant API calls (5-minute TTL).
- **Sub-5ms Execution:** Local heuristic engines on Web, Flutter, and Extension return high-quality suggestions in $< 5\text{ ms}$, ensuring a frictionless typing assistant experience.

---

## Contributing

Contributions from the open-source community are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
