import 'dart:async';
import '../models/engine_mode.dart';
import '../models/provider_config.dart';
import '../models/reply_suggestion.dart';
import 'heuristic_engine.dart';
import 'cloud_llm_engine.dart';

/// Orchestrates smart reply generation between on-device heuristics and cloud LLMs.
class HybridDispatcher {
  final CloudLlmEngine _cloudEngine;

  HybridDispatcher({CloudLlmEngine? cloudEngine})
      : _cloudEngine = cloudEngine ?? CloudLlmEngine();

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

    // 2. Cloud Only mode
    if (mode == EngineMode.cloudOnly) {
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a smart conversational assistant. Return strictly a JSON array of reply strings.',
      );
    }

    // 3. Fallback mode: Try cloud, if fails use on-device
    if (mode == EngineMode.fallback) {
      try {
        if (providerConfig.apiKey.isNotEmpty || providerConfig.baseURL.contains('localhost')) {
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

    // If no API key configured and not a local server, return local immediately
    final isLocalServer = providerConfig.baseURL.contains('localhost') || providerConfig.baseURL.contains('127.0.0.1');
    if (providerConfig.apiKey.isEmpty && !isLocalServer) {
      return localResults;
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

    if (mode == EngineMode.cloudOnly) {
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a professional editor. Return strictly a JSON array of 4 enhanced variations.',
      );
    }

    final localResults = HeuristicEngine.enhanceText(text, tone);

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

    if (mode == EngineMode.cloudOnly) {
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are a native translator in $targetLanguage. Return strictly a JSON array of 4 strings.',
      );
    }

    final localResults = HeuristicEngine.translateText(text, targetLanguage, tone);

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

    if (mode == EngineMode.cloudOnly) {
      return await _cloudEngine.complete(
        config: providerConfig,
        prompt: prompt,
        systemPrompt: 'You are an executive summarization assistant. Return strictly a JSON array of strings.',
      );
    }

    final localResults = HeuristicEngine.summarizeText(text);

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
  }
}
