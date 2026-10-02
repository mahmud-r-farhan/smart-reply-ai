class ApiConstants {
  // Default backend API URL: Android emulator loopback (10.0.2.2 maps to the
  // host machine). Override with --dart-define=SMART_REPLY_BACKEND_URL=...
  static const String defaultLocalUrl = 'http://10.0.2.2:5006/api';
  static const String suggestReply = '/suggest-reply';
  static const String enhanceText = '/enhance-text';
  static const String translateText = '/translate-text';
  static const String summarizeText = '/summarize-text';
}

class AppMode {
  static const String reply = 'reply';
  static const String enhance = 'enhance';
  static const String translate = 'translate';
  static const String summarize = 'summarize';

  static const List<AppModeOption> options = [
    AppModeOption(
      id: reply,
      label: 'Smart Reply',
      icon: '💬',
      subtitle: 'Contextual instant replies',
    ),
    AppModeOption(
      id: enhance,
      label: 'Enhance',
      icon: '✨',
      subtitle: 'Proofread and rewrite text',
    ),
    AppModeOption(
      id: translate,
      label: 'Translate',
      icon: '🌐',
      subtitle: 'Multi-style translation',
    ),
    AppModeOption(
      id: summarize,
      label: 'Summarize',
      icon: '📝',
      subtitle: 'Key takeaways and bullets',
    ),
  ];
}

class AppModeOption {
  final String id;
  final String label;
  final String icon;
  final String subtitle;

  const AppModeOption({
    required this.id,
    required this.label,
    required this.icon,
    required this.subtitle,
  });
}

class ResponseStyle {
  static const String professional = 'professional';
  static const String friendly = 'friendly';
  static const String casual = 'casual';
  static const String formal = 'formal';
  static const String concise = 'concise';
  static const String flirty = 'flirty';
  static const String romantic = 'romantic';

  static const List<StyleOption> options = [
    StyleOption(
      value: professional,
      label: 'Professional',
      emoji: '💼',
      description: 'Formal and business-ready tone',
    ),
    StyleOption(
      value: friendly,
      label: 'Friendly',
      emoji: '😊',
      description: 'Warm, approachable, and encouraging',
    ),
    StyleOption(
      value: casual,
      label: 'Casual',
      emoji: '👋',
      description: 'Relaxed and everyday conversational',
    ),
    StyleOption(
      value: concise,
      label: 'Concise',
      emoji: '⚡',
      description: 'Ultra-short and to the point',
    ),
    StyleOption(
      value: formal,
      label: 'Formal',
      emoji: '🎩',
      description: 'Polite, traditional, and respectful',
    ),
    StyleOption(
      value: flirty,
      label: 'Flirty',
      emoji: '😏',
      description: 'Playful charm with romantic interest',
    ),
    StyleOption(
      value: romantic,
      label: 'Romantic',
      emoji: '💕',
      description: 'Affectionate and deeply sincere',
    ),
  ];
}

class StyleOption {
  final String value;
  final String label;
  final String emoji;
  final String description;

  const StyleOption({
    required this.value,
    required this.label,
    required this.emoji,
    required this.description,
  });
}

class SupportedLanguages {
  static const List<LanguageOption> list = [
    LanguageOption(name: 'Spanish', code: 'es', flag: '🇪🇸'),
    LanguageOption(name: 'French', code: 'fr', flag: '🇫🇷'),
    LanguageOption(name: 'German', code: 'de', flag: '🇩🇪'),
    LanguageOption(name: 'Bengali', code: 'bn', flag: '🇧🇩'),
    LanguageOption(name: 'Japanese', code: 'ja', flag: '🇯🇵'),
    LanguageOption(name: 'Chinese', code: 'zh', flag: '🇨🇳'),
    LanguageOption(name: 'Arabic', code: 'ar', flag: '🇸🇦'),
    LanguageOption(name: 'Portuguese', code: 'pt', flag: '🇧🇷'),
    LanguageOption(name: 'Italian', code: 'it', flag: '🇮🇹'),
    LanguageOption(name: 'Hindi', code: 'hi', flag: '🇮🇳'),
    LanguageOption(name: 'English', code: 'en', flag: '🇺🇸'),
  ];
}

class LanguageOption {
  final String name;
  final String code;
  final String flag;

  const LanguageOption({
    required this.name,
    required this.code,
    required this.flag,
  });
}
