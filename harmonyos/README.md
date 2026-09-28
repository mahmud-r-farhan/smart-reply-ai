# 🌺 Native HarmonyOS Smart Reply AI (ArkTS / ArkUI)

> **Pure Native HarmonyOS Stage Model Application** built with **ArkTS**, **ArkUI**, and HarmonyOS SDK API 12. Free of Flutter or Android dependencies — 100% native HarmonyOS architecture.

---

## 🏛️ Architecture Overview

```
harmonyos/
├── build-profile.json5           # Project-level build profile (SDK API 12, Stage model)
├── hvigorfile.ts                 # Hvigor build automation entrypoint
├── oh-package.json5              # OpenHarmony package manager descriptor
├── AppScope/
│   ├── app.json5                 # Global application bundle identifier & metadata
│   └── resources/                # Global string and icon resources
└── entry/                        # Primary application module
    ├── build-profile.json5       # Module target & ArkTS compilation flags
    ├── hvigorfile.ts             # Module Hvigor build script
    ├── oh-package.json5          # Module dependencies
    └── src/main/
        ├── module.json5          # Stage Model module configuration (UIAbility, Permissions)
        ├── resources/            # Module string, color, and page profile configurations
        └── ets/
            ├── entryability/
            │   └── EntryAbility.ets       # UIAbility lifecycle (windowStage, foreground/background)
            ├── models/
            │   └── SmartReplyTypes.ets    # TypeScript/ArkTS models, modes & tone styles
            ├── services/
            │   ├── HeuristicEngine.ets    # Zero-latency on-device rules engine (< 1ms)
            │   ├── CloudEngine.ets        # Universal cloud LLM client using @ohos.net.http
            │   └── NotificationBridge.ets # Huawei Watch sync via @ohos.notificationManager
            ├── components/
            │   └── ResultCard.ets         # Interactive suggestion card with @ohos.pasteboard
            └── pages/
                └── Index.ets              # Complete ArkUI reactive dark-mode interface
```

---

## 🌟 Native Features

1. **Pure ArkTS On-Device Heuristic Engine (`< 1ms`)**:
   - Executes deterministic intent and pattern detection directly on Huawei hardware CPU/NPU.
   - 100% offline, zero battery drain, zero network latency.

2. **Native Cloud Client with `@ohos.net.http`**:
   - Connects to universal OpenAI-compatible LLM endpoints (Groq, OpenRouter, Ollama, OpenAI) via HarmonyOS Network Kit.

3. **Huawei Watch GT / Watch 4 Synchronization (`@ohos.notificationManager`)**:
   - Publishes rich interactive notifications with action buttons directly to Huawei Health and paired Huawei smartwatches.
   - Users can tap quick reply options directly on their wrist!

4. **System Clipboard Integration (`@ohos.pasteboard`)**:
   - One-tap copy of generated responses directly into the HarmonyOS system pasteboard with animated `@ohos.promptAction` toasts.

5. **Multi-Device Adaptability**:
   - Fully optimized for Huawei phones (Mate, Pura, nova), tablets (MatePad), foldables (Mate X), and 2-in-1 devices (`default`, `tablet`, `2in1`).

---

## 🛠️ How to Build & Run in DevEco Studio

### Prerequisites
1. **DevEco Studio NEXT**: Download from [Huawei Developer Portal](https://developer.huawei.com/consumer/en/deveco-studio/).
2. **HarmonyOS SDK**: API version 12 (or higher).
3. **Node.js & ohpm**: Installed automatically with DevEco Studio.

### Steps
1. Launch **DevEco Studio**.
2. Select **File** > **Open** and choose the `harmonyos/` folder.
3. Allow DevEco Studio to sync dependencies via `ohpm`.
4. Connect a HarmonyOS device or launch the **Remote Device / Emulator** in DevEco Studio.
5. Click **Run 'entry'** (`Shift + F10`) to build and deploy.

### Command-Line Build (Hvigor)
To compile a release `.hap` or `.app` via terminal:
```bash
cd harmonyos
hvigorw assembleHap --mode module -p module=entry@default -p product=default -p buildMode=release
```
Output path: `harmonyos/entry/build/default/outputs/default/entry-default-signed.hap`.
