import 'dart:async';
import '../models/engine_mode.dart';
import '../models/provider_config.dart';
import '../models/reply_suggestion.dart';
import 'heuristic_engine.dart';
import 'cloud_llm_engine.dart';
import 'api_service.dart';

/// Orchestrates smart reply generation between on-device heuristics and cloud LLMs.
class HybridDispatcher {
  final CloudLlmEngine _cloudEngine;

  /// Optional self-hosted backend bridge. Enabled from SettingsStorage so the
  /// app can use a deployed Smart Reply backend when no BYOK key is present.
  ApiService? _apiService;

  HybridDispatcher({CloudLlmEngine? cloudEngine, ApiService? apiService})
      : _cloudEngine = cloudEngine ?? CloudLlmEngine(),
        _apiService = apiService;

  /// Point the dispatcher at a backend base URL (empty string disables it).
  void updateBackendUrl(String url) {
    final clean = url.trim();
    _apiService = clean.isEmpty ? null : ApiService(baseUrl: clean);
  }

  /// Best-effort backend call: never throws, returns [] when unavailable.
  Future<List<ReplySuggestion>> _backendOrEmpty(
    Future<List<ReplySuggestion>> Function(ApiService api) call,
  ) async {
    final api = _apiService;
    if (api == null) return const [];
    try {
      return await call(api);
    } catch (_) {
      return const [];
    }
  }

  /// Primary dispatch entrypoint for Smart Reply
  Future<List<ReplySuggestion>> dispatchReply({
    required String message,
    required String tone,
    required EngineMode mode,
    required ProviderConfig providerConfig,
    int raceTimeoutMs = 1500,
  }) async {
    // 1. Offline Only mode
    if (mode == EngineMode.offlineOnly) {
      return HeuristicEngine.generateReplies(message, tone);
    }

    final prompt = 'Context message: "$message"\n'
        'Task: Generate 4 distinct smart replies in tone "$tone". Output strictly a JSON array of strings: ["r1", "r2", "r3", "r4"].';

    final hasCredentials = providerConfig.apiKey.isNotEmpty ||
        providerConfig.baseURL.contains('localhost') ||
        providerConfig.baseURL.contains('127.0.0.1');

    // 2. Cloud Only mode
    if (mode == EngineMode.cloudOnly) {
      if (!hasCredentials) {
        final backendResults = await _backendOrEmpty(
          (api) => api.suggestReply(message: message, format: tone),
        );
        return backendResults.isNotEmpty
            ? backendResults
            : HeuristicEngine.generateReplies(message, tone);
      }
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a smart conversational assistant. Return strictly a JSON array of reply strings.',
      );
    }

    // 3. Fallback mode: Try cloud, if fails use on-device (the shared backend
    // counts as cloud when no BYOK key is configured)
    if (mode == EngineMode.fallback) {
      if (!hasCredentials) {
        final backendResults = await _backendOrEmpty(
          (api) => api.suggestReply(message: message, format: tone),
        );
        if (backendResults.isNotEmpty) return backendResults;
      }
      try {
        if (hasCredentials) {
          final cloudResults = await _cloudEngine.complete(
            config: providerConfig,
            prompt: prompt,
            systemPrompt: 'You are a smart conversational assistant. Return strictly a JSON array of reply strings.',
            timeoutSeconds: 8,
          );
          if (cloudResults.isNotEmpty) return cloudResults;
        }
      } catch (_) {}
      return HeuristicEngine.generateReplies(message, tone);
    }

    // 4. Hybrid Race mode (Zero-Latency Guarantee)
    // Run heuristic instantly
    final localResults = HeuristicEngine.generateReplies(message, tone);

    // No BYOK key and not a local server: the shared backend (when configured)
    // is the only cloud option left. Its result replaces the local answer when
    // it arrives; otherwise the instant local answer stands.
    if (!hasCredentials) {
      final backendResults = await _backendOrEmpty(
        (api) => api.suggestReply(message: message, format: tone),
      );
      return backendResults.isNotEmpty ? backendResults : localResults;
    }

    // Race cloud engine against timeout
    try {
      final cloudResults = await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a smart conversational assistant. Return strictly a JSON array of reply strings.',
      ).timeout(Duration(milliseconds: raceTimeoutMs));

      if (cloudResults.isNotEmpty) {
        return cloudResults;
      }
    } catch (_) {
      // Cloud timed out or network offline: instantly return local results
    }

    return localResults;
  }

  /// Primary dispatch entrypoint for Text Enhancement
  Future<List<ReplySuggestion>> dispatchEnhance({
    required String text,
    required String tone,
    required EngineMode mode,
    required ProviderConfig providerConfig,
    int raceTimeoutMs = 1800,
  }) async {
    if (mode == EngineMode.offlineOnly) {
      return HeuristicEngine.enhanceText(text, tone);
    }

    final prompt = 'Text to enhance: "$text"\n'
        'Task: Rewrite and enhance this text in "$tone" tone. Improve clarity and impact. Output strictly a JSON array of 4 variations: ["v1", "v2", "v3", "v4"].';

    final hasCredentials = providerConfig.apiKey.isNotEmpty ||
        providerConfig.baseURL.contains('localhost') ||
        providerConfig.baseURL.contains('127.0.0.1');

    if (mode == EngineMode.cloudOnly) {
      if (!hasCredentials) {
        final backendResults = await _backendOrEmpty(
          (api) => api.enhanceText(text: text, format: tone),
        );
        return backendResults.isNotEmpty
            ? backendResults
            : HeuristicEngine.enhanceText(text, tone);
      }
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a professional editor. Return strictly a JSON array of 4 enhanced variations.',
      );
    }

    final localResults = HeuristicEngine.enhanceText(text, tone);
    if (!hasCredentials) {
      final backendResults = await _backendOrEmpty(
        (api) => api.enhanceText(text: text, format: tone),
      );
      return backendResults.isNotEmpty ? backendResults : localResults;
    }

    try {
      final cloudResults = await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a professional editor. Return strictly a JSON array of 4 enhanced variations.',
      ).timeout(Duration(milliseconds: raceTimeoutMs));

      if (cloudResults.isNotEmpty) return cloudResults;
    } catch (_) {}

    return localResults;
  }

  /// Primary dispatch entrypoint for Translation
  Future<List<ReplySuggestion>> dispatchTranslate({
    required String text,
    required String targetLanguage,
    required String tone,
    required EngineMode mode,
    required ProviderConfig providerConfig,
    int raceTimeoutMs = 2000,
  }) async {
    if (mode == EngineMode.offlineOnly) {
      return HeuristicEngine.translateText(text, targetLanguage, tone);
    }

    final prompt = 'Translate into $targetLanguage ($tone tone):\n"$text"\n'
        'Output strictly a JSON array of 4 variations (e.g. natural, polite, direct, concise): ["t1", "t2", "t3", "t4"].';

    final hasCredentials = providerConfig.apiKey.isNotEmpty ||
        providerConfig.baseURL.contains('localhost') ||
        providerConfig.baseURL.contains('127.0.0.1');

    if (mode == EngineMode.cloudOnly) {
      if (!hasCredentials) {
        final backendResults = await _backendOrEmpty(
          (api) => api.translateText(
            text: text,
            language: targetLanguage,
            format: tone,
          ),
        );
        return backendResults.isNotEmpty
            ? backendResults
            : HeuristicEngine.translateText(text, targetLanguage, tone);
      }
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a native translator in $targetLanguage. Return strictly a JSON array of 4 strings.',
      );
    }

    final localResults = HeuristicEngine.translateText(text, targetLanguage, tone);
    if (!hasCredentials) {
      final backendResults = await _backendOrEmpty(
        (api) => api.translateText(
          text: text,
          language: targetLanguage,
          format: tone,
        ),
      );
      return backendResults.isNotEmpty ? backendResults : localResults;
    }

    try {
      final cloudResults = await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a native translator in $targetLanguage. Return strictly a JSON array of 4 strings.',
      ).timeout(Duration(milliseconds: raceTimeoutMs));

      if (cloudResults.isNotEmpty) return cloudResults;
    } catch (_) {}

    return localResults;
  }

  /// Primary dispatch entrypoint for Summarization (ML Kit GenAI spec)
  Future<List<ReplySuggestion>> dispatchSummarize({
    required String text,
    required EngineMode mode,
    required ProviderConfig providerConfig,
    int raceTimeoutMs = 2200,
  }) async {
    if (mode == EngineMode.offlineOnly) {
      return HeuristicEngine.summarizeText(text);
    }

    final prompt = 'Summarize the following text:\n"$text"\n'
        'Provide 4 perspectives: executive summary, key takeaway, bullet list, and brief recap. Output strictly a JSON array of 4 strings: ["s1", "s2", "s3", "s4"].';

    final hasCredentials = providerConfig.apiKey.isNotEmpty ||
        providerConfig.baseURL.contains('localhost') ||
        providerConfig.baseURL.contains('127.0.0.1');

    if (mode == EngineMode.cloudOnly) {
      if (!hasCredentials) {
        final backendResults = await _backendOrEmpty(
          (api) => api.summarizeText(text: text, format: 'concise'),
        );
        return backendResults.isNotEmpty
            ? backendResults
            : HeuristicEngine.summarizeText(text);
      }
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are an executive summarization assistant. Return strictly a JSON array of strings.',
      );
    }

    final localResults = HeuristicEngine.summarizeText(text);
    if (!hasCredentials) {
      final backendResults = await _backendOrEmpty(
        (api) => api.summarizeText(text: text, format: 'concise'),
      );
      return backendResults.isNotEmpty ? backendResults : localResults;
    }

    try {
      final cloudResults = await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are an executive summarization assistant. Return strictly a JSON array of strings.',
      ).timeout(Duration(milliseconds: raceTimeoutMs));

      if (cloudResults.isNotEmpty) return cloudResults;
    } catch (_) {}

    return localResults;
  }

  void dispose() {
    _cloudEngine.dispose();
    _apiService?.dispose();
  }
}
