# Smart Reply AI — Universal Assistant Suite

> High-performance, cross-platform productivity ecosystem capable of seamless **Zero-Latency Offline Heuristics / On-Device ML** and **Universal OpenAI-Compatible Cloud LLM Orchestration** (Groq, OpenRouter, Ollama, OpenAI).

[![GitHub Release](https://img.shields.io/github/v/release/mahmud-r-farhan/smart-reply-ai?style=flat-square&color=blue)](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Interactive%20Showcase-emerald?style=flat-square)](https://github.com/mahmud-r-farhan/smart-reply-ai/tree/master/demo)
[![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS%20%7C%20WearOS%20%7C%20watchOS%20%7C%20HarmonyOS%20%7C%20Win32%20%7C%20Web%20%7C%20Ext-purple?style=flat-square)](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[![897.webp](https://i.postimg.cc/Dwb20cKP/897.webp)](https://postimg.cc/gxm9B8jx)

---

## Table of Contents

- [📥 Download Pre-Built Releases (v1.1.0)](#-download-pre-built-releases-v110)
- [🌐 Interactive Showcase & Demo Website](#-interactive-showcase--demo-website)
- [🔄 How It Works: Background Automation vs. In-App Studio](#-how-it-works-background-automation-vs-in-app-studio)
- [Overview](#overview)
- [Four Core Productivity Modes](#four-core-productivity-modes)
- [Unified Multi-Engine Architecture](#unified-multi-engine-architecture)
- [⌚ Smartwatch & Wear OS / watchOS Integration](#-smartwatch--wear-os--watchos-integration)
- [🌺 Pure Native HarmonyOS App (ArkTS / ArkUI)](#-pure-native-harmonyos-app-arkts--arkui)
- [Tech Stack & Modular Architecture](#tech-stack--modular-architecture)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Backend Setup](#backend-setup)
  - [Interactive Demo Showcase Setup](#interactive-demo-showcase-setup)
  - [Flutter Mobile App Setup](#flutter-mobile-app-setup)
  - [Native Windows Desktop Setup](#native-windows-desktop-setup-desktop)
  - [Browser Extension Setup](#browser-extension-setup)
  - [Web Frontend Setup](#web-frontend-setup)
- [API Reference](#api-reference)
- [Scaling, Singleflight Caching & Performance](#scaling-singleflight-caching--performance)
- [Contributing](#contributing)
- [License](#license)

---

## 📥 Download Pre-Built Releases (v1.1.0)

You do **not** need to install Flutter, Node.js, or C++ compilers to run Smart Reply AI. Pre-compiled binaries and installable packages are built automatically and published on every release:

👉 **[Download Official v1.1.0 Release Assets from GitHub](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0)**

| Platform | Download File | Size / Requirements | How to Run |
| :--- | :--- | :--- | :--- |
| **Windows (Native Assistant)** | `SmartReplyAI-standalone.exe` | $< 2\text{ MB}$, Windows 10/11 | Double-click to run. Press `Ctrl + Shift + R` anywhere! |
| **Windows (Flutter GUI)** | `smart-reply-flutter-windows-x64.zip` | $\approx 25\text{ MB}$, Windows 10/11 | Extract zip and run `smart_reply_app.exe`. |
| **Android (Phone, Tablet, Foldable)** | `smart-reply-android-release.apk` | $\approx 28\text{ MB}$, Android 6.0+ | Download on device and tap to install. (GMS-free). |
| **HarmonyOS NEXT (Native ArkTS)** | `smart-reply-harmonyos-native.zip` | $< 1\text{ MB}$, API 12 / Stage Model | Pure ArkTS source package for Huawei DevEco Studio. |
| **Chrome / Edge / Brave** | `smart-reply-chrome-extension.zip` | $< 1\text{ MB}$, Chromium browsers | Extract zip, open `chrome://extensions/`, enable Developer Mode, and click **Load unpacked**. |
| **macOS (Universal)** | `smart-reply-macos-universal.zip` | $\approx 35\text{ MB}$, macOS 11+ | Extract and drag `smart_reply_app.app` to Applications. |
| **Linux (x64)** | `smart-reply-linux-x64.tar.gz` | $\approx 20\text{ MB}$, glibc 2.31+ | Extract `tar -xvf smart-reply-linux-x64.tar.gz` and run `./smart_reply_app`. |
| **iOS (Sideload)** | `smart-reply-ios-unsigned.ipa` | $\approx 30\text{ MB}$, iOS 14+ | Sideload via AltStore, SideStore, or TrollStore. |
| **Web Client** | `smart-reply-web.zip` | $\approx 15\text{ MB}$, Static Host | Deploy to Netlify, Vercel, or any static HTTP server. |

### 🚀 Quick Start Guides

<details>
<summary><b>🪟 How to use the Native Windows Assistant (Zero-install setup)</b></summary>

1. Download **`SmartReplyAI-standalone.exe`** from [GitHub Releases v1.1.0](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0).
2. Double-click to launch. An icon appears in your Windows System Tray (near the clock).
3. Open any app on your PC (Slack, Outlook, Discord, Word, Chrome, WhatsApp).
4. Highlight any received message or simply press **`Ctrl + Shift + R`**.
5. A dark-mode suggestion pill overlay appears floating right next to your cursor.
6. Click any suggestion: it automatically pastes directly into your active conversation via native Win32 `SendInput`!
</details>

<details>
<summary><b>📱 How to install the Android APK (GMS-Free, Huawei & Wear OS Ready)</b></summary>

1. Download **`smart-reply-android-release.apk`** from [GitHub Releases v1.1.0](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0) on your phone or tablet.
2. Tap the downloaded file in your Notification Center or Downloads folder.
3. If prompted, allow "Install unknown apps" for your browser or file manager.
4. Tap **Install** and open Smart Reply AI.
5. In the app settings, toggle on **Notification Listener Service** to enable automatic background smartwatch reply pills!
</details>

<details>
<summary><b>🌺 How to build & run the Native HarmonyOS App (ArkTS / ArkUI)</b></summary>

1. Download **`smart-reply-harmonyos-native.zip`** from [GitHub Releases v1.1.0](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0) or open the `harmonyos/` folder.
2. Open the project in **Huawei DevEco Studio NEXT** (API 12+).
3. Allow DevEco Studio to sync dependencies and select **Run 'entry'** (`Shift + F10`) to deploy to your HarmonyOS phone, tablet, or emulator.
4. For complete architecture and build details, read **[harmonyos/README.md](harmonyos/README.md)**.
</details>

<details>
<summary><b>🧩 How to install the Chrome / Edge Browser Extension</b></summary>

1. Download **`smart-reply-chrome-extension.zip`** from [GitHub Releases v1.1.0](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0).
2. Extract the ZIP file into a folder on your computer.
3. Open Google Chrome, Microsoft Edge, or Brave and navigate to `chrome://extensions/`.
4. Toggle on **Developer mode** in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select the extracted folder containing `manifest.json`.
7. Pin the extension to your browser toolbar for instant smart replies in WhatsApp Web, Gmail, and Twitter!
</details>

---

## 🌐 Interactive Showcase & Demo Website

Located in the [`demo/`](demo/) directory, the official **Smart Reply AI Showcase Web App** allows you to test, visualize, and benchmark all platform capabilities directly in your browser:

* 🍏 **Apple iPhone 16 Pro & Apple Watch Ultra Sync Showcase**:
  * Visualizes the live companion ecosystem over Bluetooth 5.3 Low Energy (`WCSession`).
  * Interactive **Dynamic Island** expansion on incoming messages.
  * Apple Watch **squircle OLED display** with wrist haptic pulse animations and 3 tap-to-send suggestion pills.
  * Dispatches replies back to the iPhone iMessage thread in $< 4\text{ ms}$ with a blue `"Delivered"` confirmation.
* 📱 **Multi-Device Interactive Simulators**:
  * Experience the assistant on **Smartwatch (Wear OS & watchOS)**, **Smartphone (Android & HarmonyOS)**, **Windows C++ Desktop Assistant**, and **Browser Extension**.
* ⚡ **Live On-Device Heuristic Benchmark**:
  * Runs the real heuristic rules engine in-browser ($< 1\text{ ms}$) and displays an interactive latency bar comparison against Groq, OpenRouter, and GPT-4o.
* 📈 **High-Concurrency Backend Scaling Visualizer**:
  * Interactive slider simulating **100 to 50,000 req/sec** with real-time SHA-256 cache hit ratio calculations (up to 94%) and singleflight request deduplication.
* 🚀 **1-Click Backend Deployment Guide**:
  * Visual walk-through for deploying the backend to **Render (Free Tier)**, **Docker Compose**, and **Linux VPS**.

To run the demo site locally:
```bash
cd demo
npm install
npm run dev
```

---

## 🔄 How It Works: Background Automation vs. In-App Studio

Smart Reply AI operates in **two complementary modes**: you do **not** have to manually open an app and copy-paste text for everyday replies.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                   MODE 1: AUTOMATED BACKGROUND INTEGRATIONS                    │
│                        (Zero Manual Copy-Paste Needed)                         │
├────────────────────────┬─────────────────────────────┬─────────────────────────┤
│ Android & Wear OS      │ Windows Native C++          │ Chrome / Edge Extension │
│ Incoming Notification  │ Press Ctrl + Shift + R      │ Focus input in Gmail/   │
│   ↓                    │   ↓                         │ WhatsApp Web            │
│ Heuristic Analysis     │ Floating Pill Appears       │   ↓                     │
│   ↓                    │   ↓                         │ Suggestion Chips Appear │
│ Tap Pill on Wrist/Shade│ Click Pill to Auto-Paste    │   ↓                     │
│   ↓                    │   ↓                         │ Click to Insert into    │
│ Dispatched via Phone   │ Injected via SendInput()    │ active text field       │
└────────────────────────┴─────────────────────────────┴─────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                      MODE 2: IN-APP WORKSPACE & STUDIO                         │
│                    (Manual Paste, Deep LLMs & BYOK API)                        │
├────────────────────────────────────────────────────────────────────────────────┤
│ • Open Flutter App, Web PWA, or Native HarmonyOS Studio                        │
│ • Paste or draft any message, email, or meeting transcript                     │
│ • Select Mode: Smart Reply, Smart Enhance, Smart Translate, or Smart Summarize │
│ • Choose Tone: Professional, Friendly, Casual, Concise, Formal, Flirty         │
│ • Choose Engine: Zero-Latency Offline (<1ms), Cloud LLM (Groq/Ollama), Hybrid  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Mode 1: Automated Background Integrations (Zero-Friction)
1. **Android & Wear OS Smartwatches**:
   * Uses Android's native `NotificationListenerService` (`WearableNotificationListenerService.kt`).
   * Listens for incoming WhatsApp, Telegram, Slack, and SMS messages in the background.
   * Computes instant heuristic replies ($< 1\text{ ms}$) and attaches actionable pills directly to your notification shade and smartwatch face via `NotificationCompat.WearableExtender` with `RemoteInput.setChoices()`.
   * Tapping a pill on your smartwatch immediately dispatches the reply through the phone.
2. **Apple iPhone & Apple Watch**:
   * Uses native Swift `AppDelegate.swift` conforming to `WCSessionDelegate` and `UNTextInputNotificationAction`.
   * Sends actionable reply categories to the lock screen and Apple Watch wrist notifications.
3. **Windows Desktop Assistant (`desktop/`)**:
   * Runs in the system tray with a global keyboard hook (`Ctrl + Shift + R`).
   * Highlight text anywhere or press the shortcut; the floating assistant analyzes the clipboard and pops up dark-mode suggestion pills.
   * Clicking a pill auto-pastes the reply directly into your active window (Slack, Word, Discord, Browser) using native Win32 `SendInput`.
4. **Browser Extension (`extension/`)**:
   * Injects suggestion chips directly into web inputs (WhatsApp Web, Gmail, Twitter/X, LinkedIn) via content scripts.

### Mode 2: In-App Workspace & Studio (Full Manual Control)
When you want deeper reasoning, tone customization, or text transformation:
* Open the **Flutter Mobile App**, **React 19 Web App**, or **Native HarmonyOS App**.
* Paste any message, draft, or email into the editor.
* Select between **Smart Reply**, **Smart Enhance (Proofreading)**, **Smart Translate (11 languages)**, or **Smart Summarize**.
* Configure custom cloud providers (Groq, OpenRouter, Ollama) using your own API keys (BYOK) stored securely on-device.

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
                                  |  (Native C++, Flutter, Web, Ext, Ark) |
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
                     | - Native C++ Win32 Core          |   | - OpenRouter (Llama 3.3 70B)     |
                     | - ArkTS Native HarmonyOS Engine  |   | - Ollama (Local on-device LAN)   |
                     | - Offline execution (<1ms)       |   | - Protocol: OpenAI-compatible API|
                     | - 100% Air-Gapped Privacy        |   |                                  |
                     +----------------------------------+   +----------------------------------+
```

### Supported Operating Modes:
* **Hybrid Race (Default):** Runs local on-device heuristics instantaneously. Simultaneously queries ultra-fast cloud LLM (e.g. Groq) with a race timeout. If cloud responds within the window, it enriches the result; otherwise, user receives instant offline suggestions with zero perceived latency.
* **On-Device Offline Only:** 100% private, zero network requests, zero data egress, executes in $< 1\text{ ms}$.
* **Cloud LLM Only:** Maximum reasoning capacity for nuanced tone transformations.
* **Smart Fallback:** Primary cloud LLM with instantaneous fallback to on-device rules on any network disruption.

---

## ⌚ Smartwatch & Wear OS / watchOS Integration

Smart Reply AI turns your smartwatch into a zero-latency conversational hub:
* **Wear OS (Galaxy Watch 4/5/6/7, Pixel Watch 1/2/3, TicWatch):** Smart replies automatically render as interactive, circular suggestion pills right beneath message notifications.
* **Apple Watch (Ultra / Series 9 / Series 10):** Synchronized notification actions via Swift `WCSessionDelegate` and `UNTextInputNotificationAction`.
* **Huawei Watch (Watch GT 3/4, Watch 4 Pro):** Push notifications with quick reply templates via ArkTS `@ohos.notificationManager`.
* **Zero-Lag Processing (< 1ms):** On-device heuristic engine analyzes incoming WhatsApp, Telegram, SMS, and Slack notifications without cloud latency or battery drain.
* **Direct Auto-Reply via Device:** Tapping any suggestion pill on the watch face instantly fires a `RemoteInput` callback to the phone, dispatching the response seamlessly.

👉 **Read the complete smartwatch guide in [SMARTWATCH.md](SMARTWATCH.md)**

---

## 🌺 Pure Native HarmonyOS App (ArkTS / ArkUI)

Located in the [`harmonyos/`](harmonyos/) directory, Smart Reply AI provides a 100% pure native HarmonyOS application built for Huawei DevEco Studio and HarmonyOS NEXT (API 12+):

* **Pure Native Stage Model:** Built with ArkTS and ArkUI (no Flutter or GMS dependencies).
* **Native ArkTS Heuristic Engine:** Deterministic on-device rule matching executing in $< 1\text{ ms}$.
* **Huawei Watch GT & Watch 4 Sync:** Integrates with `@ohos.notificationManager` to publish rich notifications with actionable reply pills to connected Huawei wearables.
* **System Clipboard Integration:** Uses `@ohos.pasteboard` for one-tap copy and paste operations.
* **Direct Cloud Engine:** Implements `@ohos.net.http` for zero-dependency OpenAI-compatible cloud streaming.

👉 **Read the complete guide in [HUAWEI_HARMONYOS.md](HUAWEI_HARMONYOS.md) and [harmonyos/README.md](harmonyos/README.md)**

---

## Tech Stack & Modular Architecture

```
smart-reply/
├── demo/                 # Interactive Multiplatform Showcase Web App (Vite + React 19)
│   ├── src/components/   # AppleEcosystemSync, DeviceSimulator, BenchmarkSection, ScalingVisualizer
│   ├── server.js         # Production static server for Render web service deployment
│   └── package.json      # Scripts for local dev (npm run dev) & build (npm run build)
├── desktop/              # Native Win32 C++ Desktop App (<2MB standalone, SendInput injection, tray)
│   ├── CMakeLists.txt    # Modern CMake build configuration
│   ├── build.bat         # One-click Windows build script
│   ├── include/          # Modular headers (clipboard, cloud, floating window, tray)
│   └── src/              # Win32 GDI+ UI, WinINet cloud client, heuristic engine
├── backend/              # Node.js Express Universal Microservice
│   ├── controllers/      # suggestReply, enhanceText, translateText, summarizeText
│   ├── services/         # openRouterService (universal OpenAI protocol), heuristicEngine
│   ├── utils/            # cacheManager (L1 LRU + Redis L2), redisClient (RESP2), singleflight,
│   │                     # modelSelector, providerResolver (SSRF guard), validation, rateLimiter
│   └── server.js         # Express server with security headers & compression
├── smart_reply_app/      # Production Flutter Mobile App (Android & iOS)
│   ├── android/          # WearableNotificationListenerService, SmartReplyWatchBridge (Kotlin)
│   ├── ios/              # AppDelegate.swift with WCSessionDelegate & UNNotificationAction
│   ├── lib/services/     # heuristic_engine, cloud_llm_engine, hybrid_dispatcher, watch_bridge
│   └── lib/widgets/      # Modular UI widgets, smartwatch modal, tone selectors
├── harmonyos/            # Pure Native HarmonyOS Application (Stage Model, ArkTS, ArkUI)
│   ├── build-profile.json5 # Build settings for DevEco Studio NEXT (API 12)
│   ├── AppScope/         # Global bundle metadata & strings
│   └── entry/            # Feature module (UIAbility, Pages, ArkTS services)
├── extension/            # Chrome & Edge Browser Extension (Manifest V3)
│   ├── background.js     # Service worker with multi-engine cloud + heuristic fallback
│   ├── content.js        # Active editable field text inserter
│   └── popup.html        # Clean, modern UI with mode tabs and settings view
└── frontend/             # Standalone React 19 Web App (PWA)
    ├── src/components/   # EngineModeSelector, ProviderModal, LatencyBadge...
    └── src/store/        # useChatStore (Zustand state + client-side hybrid dispatcher)
```

---

## Getting Started & Local Setup

### Prerequisites
* [Node.js](https://nodejs.org/) v18+ and [npm](https://www.npmjs.com/) v9+
* [Flutter SDK](https://flutter.dev/docs/get-started/install) v3.10+ (for mobile app)
* CMake 3.20+ and MSVC C++ (for native Windows desktop assistant)

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:5006`. *(An API key in `.env` is optional; if none is provided, the backend automatically uses its built-in zero-latency heuristic engine!)*

Run unit tests:
```bash
npm test
```

---

### Interactive Demo Showcase Setup

```bash
cd demo
npm install
npm run dev
```

Open `http://localhost:5173` to test the Apple iPhone & Watch sync, device simulators, offline latency benchmark, and scaling visualizer.

To build the production bundle:
```bash
npm run build
npm start
```

---

### Flutter Mobile App Setup

```bash
cd smart_reply_app
flutter pub get
flutter run
```

Run linter & unit tests:
```bash
flutter analyze
flutter test
```

---

### Native Windows Desktop Setup (`desktop/`)

```cmd
cd desktop
build.bat
```
*(Or run `cmake -B build && cmake --build build --config Release`)*

Binary will be produced at `desktop/build/bin/Release/SmartReplyAI-standalone.exe`.

---

### Browser Extension Setup

1. Open Chrome/Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory.

---

### Web Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` to the backend on
`http://localhost:5006`, so start the backend first for shared cloud/backend mode.
Point `VITE_API_ENDPOINT` at a deployed backend for production builds, or use the
built-in BYOK panel (Groq / OpenRouter / OpenAI / Ollama) — the zero-latency
on-device heuristics always work with no configuration at all.

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

### Response envelope
Every generation endpoint returns the suggestions plus provenance metadata:

```json
{
  "suggestions": ["Sounds great, see you at 3!", "..."],
  "source": "cloud-llm | cache | heuristic",
  "latencyMs": 412,
  "model": "llama-3.1-8b-instant"
}
```

### 6. `GET /api/stats`
Real-time telemetry: cache hit ratio, evictions, distributed (Redis) hits, single-flight depth, and memory usage.

### 7. `GET /health` · `GET /ready`
Liveness/readiness probes used by Docker, Kubernetes, and the Nginx load balancer.

> **Security note** — client-supplied `providerConfig.baseURL` values are only accepted for known provider origins
> (OpenRouter, Groq, OpenAI, local Ollama on port 11434). The server-side API key is **never** attached to a
> non-allowlisted endpoint, which blocks SSRF and credential-exfiltration attempts. Self-hosted gateways can be
> opted in with `LLM_ALLOWED_HOSTS` or `ALLOW_CUSTOM_LLM_ENDPOINT=true` (see `backend/.env.example`).

---

## Scaling, Singleflight Caching & Performance

* **SHA-256 Content-Addressed Cache:** Identical prompts with the same parameters return in $< 1\text{ ms}$ from memory without hitting LLM rate limits.
* **Multi-Tier Cache:** Each worker keeps a bounded LRU tier; set `REDIS_URL` and horizontally scaled replicas share warm results through an optional Redis L2 tier (dependency-free RESP client with fail-open circuit breaker — Redis outages never break requests).
* **Singleflight Request Deduplication:** Prevents cache stampedes. When 500 concurrent users request suggestions for the same message, only **1 upstream request** is executed while all 499 other callers await and share the single result.
* **Deterministic Sub-1ms Execution:** Local heuristic engines on Android, iOS, Windows C++, HarmonyOS, and Web guarantee high-quality suggestions even when offline or air-gapped.
* **Tunable Under Load:** `WORKERS`, `CACHE_TTL_MS`, `CACHE_MAX_ENTRIES`, `RATE_LIMIT_*`, `LLM_TIMEOUT_MS`, `LLM_RETRIES`, and `TRUST_PROXY` are all environment-driven (see [`backend/.env.example`](backend/.env.example)).

---

## Contributing

Contributions from the open-source community are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

