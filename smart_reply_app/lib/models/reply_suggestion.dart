/// Individual suggestion with provenance and latency telemetry
class ReplySuggestion {
  final String text;
  final double confidence;
  final String source; // 'mlkit' | 'onnx' | 'cloud-llm' | 'heuristic'
  final int latencyMs;
  final String? model;

  const ReplySuggestion({
    required this.text,
    this.confidence = 0.95,
    required this.source,
    this.latencyMs = 0,
    this.model,
  });

  bool get isOffline => source == 'heuristic' || source == 'mlkit' || source == 'onnx';

  Map<String, dynamic> toJson() => {
    'text': text,
    'confidence': confidence,
    'source': source,
    'latencyMs': latencyMs,
    'model': model,
  };

  factory ReplySuggestion.fromJson(Map<String, dynamic> json) => ReplySuggestion(
    text: json['text'] as String? ?? '',
    confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
    source: json['source'] as String? ?? 'heuristic',
    latencyMs: (json['latencyMs'] as num?)?.toInt() ?? 0,
    model: json['model'] as String?,
  );

  factory ReplySuggestion.fromText(String text, {String source = 'heuristic', int latencyMs = 0}) =>
      ReplySuggestion(
        text: text,
        confidence: 0.95,
        source: source,
        latencyMs: latencyMs,
      );
}
