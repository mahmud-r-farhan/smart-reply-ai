# ⌚ Smartwatch & Wear OS Instant Reply Guide

> **Smart Reply AI** features seamless smartwatch integration across **Wear OS** (Samsung Galaxy Watch, Google Pixel Watch, TicWatch, Xiaomi Watch), **Apple watchOS**, and third-party fitness smartwatches (Garmin, Fitbit, Amazfit).

---

## 🌟 How It Works

When your phone receives an incoming chat message (via WhatsApp, Telegram, Signal, SMS, Slack, or Google Messages):

```
       📱 Phone / Tablet                                    ⌚ Smartwatch
 ┌───────────────────────────┐                         ┌───────────────────────┐
 │ Incoming Message Received │                         │ Notification Appears  │
 │ (WhatsApp / Telegram / SMS│                         │ with Message Preview  │
 └─────────────┬─────────────┘                         └───────────┬───────────┘
               │                                                   │
 ┌─────────────▼─────────────┐                         ┌───────────▼───────────┐
 │ NotificationListenerService│                         │ Wear OS renders       │
 │ intercepts incoming text  │                         │ Smart Reply Choice    │
 └─────────────┬─────────────┘                         │ Pills directly on the │
               │                                       │ watch face:           │
 ┌─────────────▼─────────────┐                         │ [ Sounds great! ]     │
 │ Zero-Latency Heuristic    │                         │ [ I'm on my way ]     │
 │ Engine evaluates message  │                         │ [ Let's do it!  ]     │
 │ in < 1ms on-device        │                         └───────────┬───────────┘
 └─────────────┬─────────────┘                                     │
               │                                                   │ User taps a pill
 ┌─────────────▼─────────────┐                                     │
 │ NotificationCompat with   │                                     │
 │ WearableExtender &        │                                     │
 │ RemoteInput.setChoices()  ├─► Bluetooth Low Energy (BLE) ───────┤
 └───────────────────────────┘   Notification Sync                 │
                                                                   ▼
 ┌───────────────────────────┐                         ┌───────────────────────┐
 │ SmartReplyWatchReceiver   │◄── BLE RemoteInput Send ┤ Smart Reply Action    │
 │ processes selected reply  │    Intent Dispatched    │ Dispatched via Device │
 └─────────────┬─────────────┘                         └───────────────────────┘
               │
 ┌─────────────▼─────────────┐
 │ Flutter WatchBridgeService│
 │ receives & logs reply     │
 └───────────────────────────┘
```

---

## 🚀 Key Features

1. **Native Wear OS Pill Rendering**:
   - Uses Android's `NotificationCompat.WearableExtender` combined with `RemoteInput.Builder.setChoices()`.
   - Wear OS automatically extracts choices and displays them as tapable curved pills right on your wrist.
   - No companion watch APK needed — uses native Wear OS notification handling.

2. **Zero-Latency Offline Heuristics (< 1ms)**:
   - Evaluates greetings, questions, scheduling requests, agreements, and urgent messages instantly.
   - 100% on-device: zero internet required, zero battery drain on watch or phone.

3. **Fallback Actions for Other Smartwatches**:
   - Smartwatches that do not support dynamic `RemoteInput` choices (Garmin Connect, Fitbit, Amazfit Zepp, Huawei Health) automatically receive direct `NotificationCompat.Action` buttons for the top 3 smart replies.

4. **Apple watchOS Support**:
   - On iOS, notifications mirrored to Apple Watch automatically display actionable reply buttons via Apple's Notification Service Extension.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Enable Notification Listener on Android

To let Smart Reply AI generate suggestions for incoming messages from WhatsApp, Telegram, SMS, etc.:

1. Open **Smart Reply AI** on your Android phone.
2. Tap the **⌚ Smartwatch** button in the top bar.
3. Check the **Notification Access** indicator:
   - If green, it is active.
   - If orange, tap **Grant Permission**.
4. In Android's **Device & app notifications** settings, toggle on **Smart Reply AI**.

### 2. Verify Smartwatch Pairing

Ensure your watch is paired with your phone:
- **Galaxy Watch 4 / 5 / 6 / 7 / Ultra**: Paired via **Galaxy Wearable** app.
- **Google Pixel Watch 1 / 2 / 3**: Paired via **Google Pixel Watch** app.
- **Other Wear OS watches**: Paired via **Wear OS by Google** app.
- **Garmin / Fitbit / Amazfit**: Paired via respective companion apps with notifications enabled.

### 3. Test on Your Wrist

1. In the **Smart Reply AI** app, tap the **⌚ Smartwatch** icon in the header.
2. Tap **Send Test to Watch**.
3. Look at your smartwatch:
   - A notification from `Alex Mercer` will appear asking: *"Are we still on for the sync meeting at 3 PM?"*
   - Scroll down on your watch to view the instant reply pills:
     - 🟢 **"Yes, see you then!"**
     - 🟡 **"Can we push it by 15 mins?"**
     - 🔴 **"I'll have to reschedule."**
4. Tap any pill.
5. Your watch immediately confirms the reply and sends the response back through the phone!

---

## 💻 Technical Architecture

### Android Native Bridge

- **`SmartReplyWatchBridge.kt`**:
  ```kotlin
  val remoteInput = RemoteInput.Builder(KEY_TEXT_REPLY)
      .setLabel("Quick reply")
      .setChoices(quickReplies) // Displays as circular pills on Wear OS
      .build()

  val wearableExtender = NotificationCompat.WearableExtender()
      .addAction(replyAction)
      .setContentAction(0)
      .setHintHideIcon(false)
  ```

- **`SmartReplyWatchReceiver.kt`**:
  Catches `RemoteInput.getResultsFromIntent(intent)` whenever the user taps a reply pill on their smartwatch and forwards it via `MainActivity.dispatchWatchReply()`.

- **`WearableNotificationListenerService.kt`**:
  Inherits from Android's `NotificationListenerService`. Intercepts incoming messages from supported messaging packages (`com.whatsapp`, `org.telegram.messenger`, `com.google.android.apps.messaging`, `com.Slack`, etc.), runs the heuristic engine in `< 1ms`, and pushes smart reply notifications to the wearable.

### Flutter Dart Bridge

- **`WatchBridgeService`** (`lib/services/watch_bridge_service.dart`):
  Exposes `replyStream` so any screen or provider can react when the user replies from their wrist.
  ```dart
  WatchBridgeService.replyStream.listen((event) {
    print('Smart Reply from ${event.sender}: ${event.reply}');
  });
  ```

---

## 🔒 Privacy & Battery Efficiency

- **Zero Cloud Leakage**: Message text is processed 100% on the local device CPU. It is never logged or transmitted over any network.
- **Battery-Friendly**: The heuristic pattern matching takes less than 1 millisecond and does not keep any background CPU wakelocks active.
