/// Universal Cloud LLM Provider Configuration
class ProviderConfig {
  final String id;
  final String name;
  final String baseURL;
  final String apiKey;
  final String model;
  final double temperature;
  final int maxTokens;

  const ProviderConfig({
    required this.id,
    required this.name,
    required this.baseURL,
    this.apiKey = '',
    required this.model,
    this.temperature = 0.7,
    this.maxTokens = 350,
  });

  ProviderConfig copyWith({
    String? id,
    String? name,
    String? baseURL,
    String? apiKey,
    String? model,
    double? temperature,
    int? maxTokens,
  }) {
    return ProviderConfig(
      id: id ?? this.id,
      name: name ?? this.name,
      baseURL: baseURL ?? this.baseURL,
      apiKey: apiKey ?? this.apiKey,
      model: model ?? this.model,
      temperature: temperature ?? this.temperature,
      maxTokens: maxTokens ?? this.maxTokens,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'baseURL': baseURL,
    'apiKey': apiKey,
    'model': model,
    'temperature': temperature,
    'maxTokens': maxTokens,
  };

  factory ProviderConfig.fromJson(Map<String, dynamic> json) => ProviderConfig(
    id: json['id'] as String? ?? 'groq',
    name: json['name'] as String? ?? 'Groq',
    baseURL: json['baseURL'] as String? ?? 'https://api.groq.com/openai/v1',
    apiKey: json['apiKey'] as String? ?? '',
    model: json['model'] as String? ?? 'llama-3.1-8b-instant',
    temperature: (json['temperature'] as num?)?.toDouble() ?? 0.7,
    maxTokens: (json['maxTokens'] as num?)?.toInt() ?? 350,
  );

  static const List<ProviderConfig> defaultPresets = [
    ProviderConfig(
      id: 'groq',
      name: 'Groq (Ultra-Fast LPU)',
      baseURL: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
    ),
    ProviderConfig(
      id: 'openrouter',
      name: 'OpenRouter (Multi-Model)',
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
    ),
    ProviderConfig(
      id: 'ollama',
      name: 'Ollama (Local / LAN Server)',
      baseURL: 'http://localhost:11434/v1',
      model: 'llama3.2:latest',
    ),
    ProviderConfig(
      id: 'openai',
      name: 'OpenAI Direct',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    ),
  ];
}
