/// Engine operating modes aligned with system blueprint
enum EngineMode {
  hybridRace,
  offlineOnly,
  cloudOnly,
  fallback;

  String get label {
    switch (this) {
      case EngineMode.hybridRace:
        return 'Hybrid Race';
      case EngineMode.offlineOnly:
        return 'Offline Zero-Latency';
      case EngineMode.cloudOnly:
        return 'Cloud LLM';
      case EngineMode.fallback:
        return 'Smart Fallback';
    }
  }

  String get shortTag {
    switch (this) {
      case EngineMode.hybridRace:
        return 'Hybrid ⚡';
      case EngineMode.offlineOnly:
        return 'On-Device 🔒';
      case EngineMode.cloudOnly:
        return 'Cloud ☁️';
      case EngineMode.fallback:
        return 'Fallback 🛡️';
    }
  }

  String get description {
    switch (this) {
      case EngineMode.hybridRace:
        return 'Instant on-device suggestion raced with fast cloud LLM';
      case EngineMode.offlineOnly:
        return '100% private, on-device rules with <5ms latency and zero data egress';
      case EngineMode.cloudOnly:
        return 'High-reasoning cloud LLM (Groq, OpenRouter, Ollama)';
      case EngineMode.fallback:
        return 'Cloud primary with instantaneous on-device fallback if offline';
    }
  }
}
