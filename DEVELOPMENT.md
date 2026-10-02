# Developer Guide & API Reference

Welcome to the **SmartReply AI Developer Guide**. This document contains in-depth information about our multi-engine architecture, how to extend offline heuristics, configure AI providers, and debug across client targets.

---

## 1. Engine Protocols

### A. Universal OpenAI-Compatible Cloud Protocol
All clients (Flutter, React, Chrome Extension, HarmonyOS ArkTS, Win32 C++) communicate with cloud providers using the standard OpenAI chat completions endpoint:
- **Default Endpoint**: `POST {baseUrl}/chat/completions`
- **Request Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {apiKey}` (omitted or dummy for local Ollama)
  - `HTTP-Referer: https://github.com/mahmud-r-farhan/smart-reply-ai` (for OpenRouter)
  - `X-Title: SmartReply AI`

#### Request Payload Structure
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {
      "role": "system",
      "content": "You are SmartReply AI..."
    },
    {
      "role": "user",
      "content": "Sounds good, see you at 5!"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 512
}
```

#### Provider Presets & Endpoints
| Provider | Default Base URL | Recommended Fast Model |
| :--- | :--- | :--- |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct` |
| **Ollama (Local)** | `http://127.0.0.1:11434/v1` | `llama3.2:latest` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |

---

## 2. Extending the Offline Heuristic Engine

The offline heuristic engine guarantees zero latency (< 5ms) and works even without internet connectivity or API keys. It is implemented consistently across platforms:
- **Dart**: [smart_reply_app/lib/services/heuristic_engine.dart](smart_reply_app/lib/services/heuristic_engine.dart)
- **JavaScript (Web & Extension)**: [frontend/src/utils/heuristicEngine.js](frontend/src/utils/heuristicEngine.js) & [backend/services/heuristicEngine.js](backend/services/heuristicEngine.js)
- **C++**: [desktop/src/heuristic_engine.cpp](desktop/src/heuristic_engine.cpp)

### Rules for Adding New Heuristic Patterns
When adding new response triggers or grammar rules:
1. **Purity**: Methods must be synchronous, non-blocking, and free of external side effects.
2. **Speed**: Regular expressions must be simple and pre-compiled/cached where supported. Execution must finish under 5ms.
3. **Fallback Safety**: If pattern matching yields no confidence, always return safe, context-appropriate generic responses (e.g. `["Understood.", "Thank you for the update.", "I will get back to you shortly."]`).

---

## 3. Platform Debugging Tips

### Flutter Multiplatform
```bash
cd smart_reply_app

# Run with verbose logging
flutter run -v -d windows

# Analyze static types and lints
flutter analyze --fatal-infos

# Run unit tests
flutter test
```

### Chrome Extension MV3
- Open `chrome://extensions/`
- Click **Inspect views: service worker** to view console logs for `background.js`.
- Open any webpage, right-click, and click **Inspect** -> **Console** to view logs from `content.js`.

### Win32 C++ Native Floating App
- Build in Debug configuration:
  ```bash
  cd desktop
  cmake -B build -DCMAKE_BUILD_TYPE=Debug
  cmake --build build
  ```
- Use Visual Studio or WinDbg to attach to `SmartReplyAI.exe` and test the low-level keyboard hook callback `LowLevelKeyboardProc`.

---

## 4. Contributing Checklist Before Git Commit
1. Verify `flutter analyze` has zero issues.
2. Verify `npm run build` succeeds in `frontend/`.
3. Check that no API tokens, test keys, or secrets are hardcoded.
4. Ensure files end with standard trailing newlines.
