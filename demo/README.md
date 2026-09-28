# ⚡ Smart Reply AI — Interactive Multiplatform Showcase Website

> A high-performance, dark-mode showcase and interactive demonstration website built with **Vite + React** and vanilla CSS. Demonstrates on-device & smartwatch interactions, offline vs cloud latency benchmarks, backend scaling simulation, visual deployment pipelines, and official **v1.1.0 multiplatform downloads**.

---

## 🌟 Features Included

1. **Interactive Multiplatform Device Simulator**:
   - ⌚ **Smartwatch (Wear OS & Apple Watch)**: Interactive round watch face showing notification pills and BLE dispatching back through the phone in `0.8ms`.
   - 📱 **Android & HarmonyOS Smartphone**: Mobile chat interface with instant context-aware smart reply chips in 7 customizable tones.
   - 🪟 **Desktop (Win32 Native C++)**: Floating pill assistant preview with global hotkey (`Ctrl + Shift + R`) and direct `SendInput` auto-paste into active windows.
   - 🌐 **Web Client & Chromium Extension**: Manifest V3 browser overlay for Gmail, Outlook Web, and LinkedIn.

2. **Live On-Device Heuristic Benchmark**:
   - In-browser execution of the deterministic rules engine (&lt; 1ms).
   - Real-time latency comparison against Groq LPU, OpenRouter, and OpenAI GPT-4o.

3. **High-Concurrency Backend Scaling Visualizer**:
   - Interactive slider simulating `100` to `50,000` requests/second.
   - Visualizes multi-worker clustering, SHA-256 caching (up to 94% hit ratio), and **Singleflight request deduplication** preventing thundering herds.

4. **Visual Backend Deployment Guide**:
   - Step-by-step instructions for **Render**, **Docker Compose**, and **VPS (Ubuntu & Nginx)** with health check verification (`/health`).
   - Copyable production environment variables (`.env`).

5. **Multiplatform Download Hub (v1.1.0)**:
   - Direct download links pointing to [GitHub Release v1.1.0](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0) for:
     - Windows Native C++ Assistant (`SmartReplyAI-standalone.exe`)
     - Android Release APK (`smart-reply-android-release.apk`)
     - HarmonyOS Native ArkTS (`smart-reply-harmonyos-native.zip`)
     - Chrome / Edge Extension (`smart-reply-chrome-extension.zip`)
     - Windows Flutter GUI (`smart-reply-flutter-windows-x64.zip`)
     - macOS Universal (`smart-reply-macos-universal.zip`)
     - Linux x64 GTK (`smart-reply-linux-x64.tar.gz`)
     - iOS Unsigned IPA (`smart-reply-ios-unsigned.ipa`)
     - Static Web Distribution (`smart-reply-web.zip`)

---

## 🚀 Running Locally

```bash
cd demo
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Render

You can deploy this showcase website to **Render** in two ways:

### Option A: Static Site on Render (Recommended & 100% Free)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Static Site**.
2. Connect your GitHub repository: `mahmud-r-farhan/smart-reply-ai`.
3. Configure the settings:
   - **Root Directory:** `demo`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Click **Create Static Site**. Render will automatically build and distribute the app globally on their CDN!

### Option B: Node Web Service on Render
1. Click **New +** > **Web Service**.
2. Connect the repository.
3. Configure settings:
   - **Root Directory:** `demo`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Render will start the bundled production static server (`server.js`) listening on `process.env.PORT`.
