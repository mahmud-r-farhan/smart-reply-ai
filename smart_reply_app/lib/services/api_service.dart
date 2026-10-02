import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/provider_config.dart';
import '../models/reply_suggestion.dart';
import '../utils/app_config.dart';
import '../utils/constants.dart';

class ApiService {
  final http.Client _client;
  String _baseUrl;

  ApiService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.baseUrl;

  void updateBaseUrl(String url) {
    _baseUrl = url.trim();
  }

  /// Generate smart reply suggestions via backend API
  Future<List<ReplySuggestion>> suggestReply({
    required String message,
    required String format,
    ProviderConfig? providerConfig,
    bool refresh = false,
  }) async {
    return _sendRequest(
      endpoint: ApiConstants.suggestReply,
      body: {
        'message': message,
        'format': format,
        if (refresh) 'refresh': true,
        if (providerConfig != null) 'providerConfig': providerConfig.toJson(),
      },
      key: 'suggestions',
    );
  }

  /// Enhance text via backend API
  Future<List<ReplySuggestion>> enhanceText({
    required String text,
    required String format,
    ProviderConfig? providerConfig,
    bool refresh = false,
  }) async {
    return _sendRequest(
      endpoint: ApiConstants.enhanceText,
      body: {
        'text': text,
        'format': format,
        if (refresh) 'refresh': true,
        if (providerConfig != null) 'providerConfig': providerConfig.toJson(),
      },
      key: 'enhancements',
    );
  }

  /// Translate text via backend API
  Future<List<ReplySuggestion>> translateText({
    required String text,
    required String language,
    required String format,
    ProviderConfig? providerConfig,
    bool refresh = false,
  }) async {
    return _sendRequest(
      endpoint: ApiConstants.translateText,
      body: {
        'text': text,
        'language': language,
        'format': format,
        if (refresh) 'refresh': true,
        if (providerConfig != null) 'providerConfig': providerConfig.toJson(),
      },
      key: 'translations',
    );
  }

  /// Summarize text via backend API
  Future<List<ReplySuggestion>> summarizeText({
    required String text,
    required String format,
    ProviderConfig? providerConfig,
    bool refresh = false,
  }) async {
    return _sendRequest(
      endpoint: ApiConstants.summarizeText,
      body: {
        'text': text,
        'format': format,
        if (refresh) 'refresh': true,
        if (providerConfig != null) 'providerConfig': providerConfig.toJson(),
      },
      key: 'summaries',
    );
  }

  Future<List<ReplySuggestion>> _sendRequest({
    required String endpoint,
    required Map<String, dynamic> body,
    required String key,
  }) async {
    final stopwatch = Stopwatch()..start();
    try {
      final url = _baseUrl.endsWith('/')
          ? '$_baseUrl${endpoint.replaceFirst('/', '')}'
          : '$_baseUrl$endpoint';

      final response = await _client.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(ContentLimits.requestTimeout);

      stopwatch.stop();

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        final list = data[key] as List<dynamic>?;
        final latency = (data['latencyMs'] as num?)?.toInt() ?? stopwatch.elapsedMilliseconds;
        final source = (data['source'] as String?) ?? 'backend-api';

        return list?.map((s) => ReplySuggestion(
          text: s.toString(),
          confidence: 0.95,
          source: source,
          latencyMs: latency,
        )).toList() ?? [];
      } else {
        throw ApiException('Server returned ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}');
    }
  }

  void dispose() {
    _client.close();
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
