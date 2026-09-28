import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/provider_config.dart';
import '../models/reply_suggestion.dart';

/// Universal OpenAI-Compatible Cloud LLM Engine for Flutter
/// Calls Groq, OpenRouter, Ollama, or OpenAI directly with standard /v1/chat/completions format.
class CloudLlmEngine {
  final http.Client _client;

  CloudLlmEngine({http.Client? client}) : _client = client ?? http.Client();

  /// Execute chat completion against any standard OpenAI-compatible endpoint
  Future<List<ReplySuggestion>> complete({
    required ProviderConfig config,
    required String prompt,
    String systemPrompt = 'You are a helpful AI communication assistant.',
    int timeoutSeconds = 12,
  }) async {
    final stopwatch = Stopwatch()..start();
    final baseURL = config.baseURL.trim();
    final urlStr = baseURL.endsWith('/')
        ? '${baseURL}chat/completions'
        : '$baseURL/chat/completions';

    final uri = Uri.parse(urlStr);
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    if (config.apiKey.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer ${config.apiKey.trim()}';
    }

    if (baseURL.contains('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://github.com/mahmud-r-farhan/smart-reply';
      headers['X-Title'] = 'Smart Reply App';
    }

    final body = jsonEncode({
      'model': config.model,
      'messages': [
        {'role': 'system', 'content': systemPrompt},
        {'role': 'user', 'content': prompt},
      ],
      'temperature': config.temperature,
      'max_tokens': config.maxTokens,
    });

    final response = await _client
        .post(uri, headers: headers, body: body)
        .timeout(Duration(seconds: timeoutSeconds));

    stopwatch.stop();
    final latency = stopwatch.elapsedMilliseconds;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body);
      final choices = data['choices'] as List<dynamic>?;
      final content = choices?.firstOrNull?['message']?['content']?.toString().trim() ?? '';

      final parsed = _parseLlmArray(content);
      return parsed.map((text) => ReplySuggestion(
        text: text,
        confidence: 0.96,
        source: 'cloud-llm',
        latencyMs: latency,
        model: config.model,
      )).toList();
    } else {
      throw Exception('Cloud LLM returned ${response.statusCode}: ${response.body}');
    }
  }

  /// Parse response into a clean list of suggestions
  List<String> _parseLlmArray(String content) {
    if (content.isEmpty) return [];

    // 1. Direct JSON array parse
    try {
      final decoded = jsonDecode(content);
      if (decoded is List) {
        return decoded.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).take(4).toList();
      } else if (decoded is Map) {
        final inner = decoded['replies'] ?? decoded['suggestions'] ?? decoded['variations'] ?? decoded.values;
        if (inner is Iterable) {
          return inner.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).take(4).toList();
        }
      }
    } catch (_) {}

    // 2. Extract JSON bracketed array
    final bracketMatch = RegExp(r'\[[\s\S]*\]').firstMatch(content);
    if (bracketMatch != null) {
      try {
        final decoded = jsonDecode(bracketMatch.group(0)!);
        if (decoded is List) {
          return decoded.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).take(4).toList();
        }
      } catch (_) {}
    }

    // 3. Fallback: Parse numbered/bullet lines
    final lines = content
        .split('\n')
        .map((l) {
          var clean = l.replaceAll(RegExp(r'^\s*([*\-•\d\.\)]+)\s*'), '').trim();
          if (clean.startsWith('"') || clean.startsWith("'")) {
            clean = clean.substring(1);
          }
          if (clean.endsWith('"') || clean.endsWith("'")) {
            clean = clean.substring(0, clean.length - 1);
          }
          return clean.trim();
        })
        .where((l) => l.isNotEmpty && !l.startsWith('```'))
        .take(4)
        .toList();

    return lines.isNotEmpty ? lines : [content];
  }

  void dispose() {
    _client.close();
  }
}
