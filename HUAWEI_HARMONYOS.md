# 🌺 Huawei AppGallery & HarmonyOS Integration Guide

> **Smart Reply AI** is engineered from the ground up to be **100% Google Play Services (GMS) independent**, making it fully compatible with **Huawei AppGallery**, **HarmonyOS 2 / 3 / 4**, and **HarmonyOS NEXT** devices (including Huawei Mate, Pura, nova, MatePad, and Huawei Watch series).

---

## 🏗️ Architecture & Dual-Track Support

Huawei devices in the wild run on two ecosystems:

| Platform Track | Operating System | Package Format | Distribution Channel | GMS Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Track 1: AppGallery APK (Global Standard)** | HarmonyOS 2/3/4, EMUI 10-14 | `.apk` / `.aab` | **Huawei AppGallery** / Direct APK Sideload | ❌ Zero GMS required |
| **Track 2: HarmonyOS NEXT (Pure Microkernel)** | HarmonyOS NEXT | `.hap` (Harmony Ability) | **AppGallery NEXT** | ❌ 100% GMS-free |

---

## 🌟 Why Smart Reply AI Works Out-of-the-Box on Huawei & HarmonyOS

1. **Zero GMS Hard-Locks**:
   - Traditional apps fail on modern Huawei devices because they import `com.google.android.gms` (Firebase, Google Play Billing, Google Location).
   - Smart Reply AI uses pure Dart/Kotlin on-device heuristic algorithms (`< 1ms`) and standard REST/HTTP protocols for cloud LLMs (Groq, OpenRouter, Ollama, OpenAI).
   - No Google Play services or background Google frameworks are required.

2. **Official Huawei Maven Repository Included**:
   - Configured in `smart_reply_app/android/settings.gradle.kts` and `smart_reply_app/android/build.gradle.kts`:
     ```kotlin
     maven { url = uri("https://developer.huawei.com/repo/") }
     ```

3. **Foldable & Tablet Multi-Window Optimization**:
   - Configured in `smart_reply_app/android/app/src/main/AndroidManifest.xml` for Huawei Mate X foldables and MatePad tablets:
     ```xml
     <meta-data android:name="notch.config" android:value="portrait|landscape" />
     <meta-data android:name="android.max_aspect" android:value="2.4" />
     <meta-data android:name="EasyGoClient" android:value="true" />
     <meta-data android:name="hw_multiwindow_support" android:value="true" />
     ```

4. **Huawei Smartwatch Integration (Huawei Watch GT, Watch 4, Watch Fit)**:
   - When paired with an Android or HarmonyOS phone running the **Huawei Health** app, notifications posted by Smart Reply AI with `NotificationCompat.Action` buttons are mirrored to the Huawei Watch.
   - Users can tap quick reply options directly on their wrist!

---

## 🚀 How to Publish to Huawei AppGallery (Step-by-Step)

### Step 1: Register as a Huawei Developer
1. Go to [Huawei Developer Console](https://developer.huawei.com/consumer/en/).
2. Sign up and verify your developer identity (Individual or Organization).

### Step 2: Create App in AppGallery Connect (AGC)
1. In the console, navigate to **My Apps** > **New App**.
2. Set Package Type: **APK** or **App**.
3. Package Name: `com.smartreply.smart_reply_app`.
4. App Category: **Tools / Communication**.

### Step 3: Download Pre-Built Huawei APK
You can directly download the release APK from GitHub Releases:
- **`smart-reply-huawei-appgallery-release.apk`** from [GitHub Releases](https://github.com/mahmud-r-farhan/smart-reply-ai/releases/latest).

Or compile it manually with Flutter:
```bash
cd smart_reply_app
flutter pub get
flutter build apk --release --no-tree-shake-icons
```
Output path: `smart_reply_app/build/app/outputs/flutter-apk/app-release.apk`.

### Step 4: Upload and Submit for Review
1. In AppGallery Connect, click **Version information** > **Software version**.
2. Upload `smart-reply-huawei-appgallery-release.apk`.
3. Add screenshots, privacy policy link, and app description.
4. Click **Submit** for AppGallery review.

---

## 🛠️ Building for HarmonyOS NEXT (`.hap`)

For deployment to the native HarmonyOS NEXT microkernel:

1. **Install DevEco Studio NEXT**:
   - Download DevEco Studio NEXT Beta from the [Huawei Developer Portal](https://developer.huawei.com/consumer/en/deveco-studio/).
2. **Use OpenHarmony Flutter Engine**:
   - Clone the official OpenHarmony SIG Flutter engine:
     ```bash
     git clone -b dev https://gitee.com/openharmony-sig/flutter_flutter.git
     ```
3. **Build Harmony Ability Package (`.hap`)**:
   ```bash
   flutter build hap --release
   ```
4. Sign the package in DevEco Studio using your Huawei Developer Profile and Certificate.

---

## 🔒 Privacy & Compliance

- **No Data Harvesting**: Zero background tracking or telemetry egress.
- **Local Heuristics**: Intent classification and instant responses execute 100% locally on the device CPU/NPU.
- **AppGallery Security Compliance**: Meets all Huawei AppGallery privacy security guidelines.
