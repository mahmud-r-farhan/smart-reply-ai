/// Application Configuration and Metadata
class AppConfig {
  // App Information
  static const String appName = 'Smart Reply AI';
  static const String appVersion = '1.1.0';
  static const int buildNumber = 2;
  static const String packageName = 'com.smartreply.app';
  static const String bundleId = 'com.smartreply.app';

  // Developer Information
  static const String developerName = 'Mahmud Rahman';
  static const String developerEmail = 'farhanstack.dev@gmail.com';
  
  // Social Links
  static const String githubUrl = 'https://github.com/mahmud-r-farhan';
  static const String linkedinUrl = 'https://www.linkedin.com/in/mahmud-r-farhan/';
  static const String gravatarUrl = 'https://gravatar.com/floawd';
  static const String developerAvatar =
      'https://avatars.githubusercontent.com/u/114731414?v=4';

  // App Description
  static const String appDescription =
      'AI-powered messaging enhancement tool that helps you craft perfect responses and enhance your text.';

  static const String appFullDescription =
      'Smart Reply is an intelligent messaging assistant powered by cutting-edge AI technology. '
      'Whether you need to generate smart replies to incoming messages or enhance your text with different tones and styles, '
      'Smart Reply has you covered. Our app helps you communicate more effectively while maintaining your unique voice.';

  // Features
  static const List<String> features = [
    'Smart reply generation',
    'Text enhancement with multiple styles',
    'Professional, friendly, humorous, and concise styles',
    'Copy-to-clipboard functionality',
    'Regenerate responses',
    'Privacy-first approach',
    'Modern, intuitive UI',
    'Fast and reliable performance',
  ];

  // Technical Stack
  static const List<String> techStack = [
    'Flutter',
    'Provider',
    'Dart',
    'Material Design 3',
    'OpenRouter API',
    'Google Fonts',
  ];

  // App Store & Play Store Information
  static const String appStoreCategory = 'Productivity';
  static const String appStoreKeywords =
      'AI, messaging, smart reply, text enhancement, productivity';

  // Minimum Requirements
  static const int minAndroidApi = 21; // Android 5.0
  static const String minIosVersion = '12.0';

  // API Configuration.
  // Override at build time:
  //   flutter run --dart-define=SMART_REPLY_BACKEND_URL=http://192.168.1.20:5006/api
  static const String baseUrl = String.fromEnvironment(
    'SMART_REPLY_BACKEND_URL',
    defaultValue: 'http://10.0.2.2:5006/api',
  );

  // License Information
  static const String licenseName = 'MIT License';
  static const String licenseYear = '2024';
  static const String copyrightHolder = 'Mahmud Rahman';

  // Privacy & Terms
  static const String privacyPolicyUrl = 'https://smartreply.app/privacy';
  static const String termsOfServiceUrl = 'https://smartreply.app/terms';
  static const String supportEmail = 'support@smartreply.app';

  // Social Media (for marketing)
  static const String twitterHandle = '@smartreply_app';
  static const String instagramHandle = 'smartreply.app';

  // About Section Metadata
  static const String developerTitle = 'Creative Developer';
  static const String developerBio =
      'MERN stack specialist & AI enthusiast. Building intuitive UIs and powerful tools for modern communication.';

  // App Permissions Description
  static const String internetPermissionDescription =
      'Required to communicate with AI service and generate responses.';
  static const String contactsPermissionDescription =
      'Optional: To identify contacts in your messages.';
}

/// Analytics Events
class AnalyticsEvents {
  static const String appOpened = 'app_opened';
  static const String repliesGenerated = 'replies_generated';
  static const String textEnhanced = 'text_enhanced';
  static const String responseCopied = 'response_copied';
  static const String modeChanged = 'mode_changed';
  static const String styleChanged = 'style_changed';
  static const String regenerateClicked = 'regenerate_clicked';
  static const String aboutPanelOpened = 'about_panel_opened';
  static const String socialLinkClicked = 'social_link_clicked';
}

/// Error Messages (User-friendly)
class ErrorMessages {
  static const String networkError =
      'Unable to connect to the server. Please check your internet connection.';
  static const String apiError =
      'An error occurred while processing your request. Please try again.';
  static const String emptyInputError = 'Please enter some text to get started.';
  static const String timeoutError =
      'Request timed out. Please try again with a shorter message.';
  static const String unknownError = 'Something went wrong. Please try again.';
  static const String invalidResponse =
      'Received an invalid response. Please try again.';
}

/// Success Messages
class SuccessMessages {
  static const String copiedToClipboard = 'Copied to clipboard!';
  static const String regenerated = 'Responses regenerated successfully!';
}

/// Content Limits
class ContentLimits {
  static const int maxInputLength = 2000;
  static const int minInputLength = 1;
  static const int maxResultsCount = 5;
  static const Duration requestTimeout = Duration(seconds: 30);
}
