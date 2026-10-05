import '../models/reply_suggestion.dart';

/// On-Device Heuristic Engine for Flutter
/// Executes in < 5ms with 0 network calls, providing instant offline replies,
/// text enhancement, translation approximations, and summarization.
class HeuristicEngine {
  /// v1.1.0 shipped the misspelled "flating" token; accept it forever.
  static String _normalizeTone(String tone) {
    final lower = tone.toLowerCase();
    return lower == 'flating' ? 'flirty' : lower;
  }

  static final List<_IntentPattern> _intentPatterns = [
    _IntentPattern(
      regex: RegExp(r'\b(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup)\b', caseSensitive: false),
      replies: {
        'professional': [
          'Hello! Thank you for reaching out. How can I assist you today?',
          'Good day! I hope you are having a productive week.',
          'Hello! Thanks for connecting. What can I do for you?',
          'Greetings! Glad to hear from you.',
        ],
        'friendly': [
          'Hey there! Great to hear from you! How\'s everything going? 😊',
          'Hi! Hope your day is going wonderfully!',
          'Hey! Always happy to connect. What\'s up?',
          'Hello! Hope you\'re having an awesome day!',
        ],
        'casual': [
          'Hey! What\'s up?',
          'Yo! How\'s it going?',
          'Hey there, good to hear from you!',
          'Sup! What\'s on your mind?',
        ],
        'formal': [
          'Greetings. Thank you for your correspondence.',
          'Good day. I acknowledge receipt of your message.',
          'Dear colleague, I hope this message finds you well.',
          'Respectfully received. How may I be of service?',
        ],
        'flirty': [
          'Hey there! You just brightened up my whole day! 😉',
          'Hello pleasant surprise! What can I do for you?',
          'Hey! Seeing your name pop up always makes me smile.',
          'Hi! You definitely know how to make an entrance.',
        ],
        'romantic': [
          'Hello my love, thinking of you always warms my heart. ❤️',
          'Hey darling, so happy to hear from you.',
          'Hi sweetheart, you\'re the brightest part of my day.',
          'Hello beautiful, my thoughts were already with you.',
        ],
        'concise': [
          'Hello! How can I help?',
          'Hi there! What\'s up?',
          'Greetings, how may I assist?',
          'Hello!',
        ],
      },
    ),
    _IntentPattern(
      regex: RegExp(r'\b(how are you|how’s it going|how are things|doing good)\b', caseSensitive: false),
      replies: {
        'professional': [
          'I\'m doing well, thank you for asking. How are things on your end?',
          'All is progressing smoothly here. Thank you for checking in.',
          'Doing well and staying focused. I hope all is well with you too.',
          'Very well, thank you. Ready to collaborate whenever you are.',
        ],
        'friendly': [
          'Doing great, thanks for asking! How about yourself? 😊',
          'All good on my side! Hope you\'re having a wonderful week!',
          'Can\'t complain at all! Things are great. What\'s new with you?',
          'Doing fantastic! Really appreciate you asking!',
        ],
        'casual': [
          'All good here! How about you?',
          'Can\'t complain! Living the dream. You?',
          'Pretty good, just keeping busy!',
          'Doing alright! How\'s life on your side?',
        ],
        'formal': [
          'I am functioning optimally, thank you. I trust your endeavors are fruitful.',
          'All is well in our department. Thank you for your kind inquiry.',
          'I am doing well and appreciate your courtesy.',
          'In good standing, thank you. I hope the same applies to you.',
        ],
        'flirty': [
          'Much better now that you\'ve messaged me! 😉',
          'Can\'t complain, especially now that I\'m talking to you.',
          'Doing great, but definitely thinking of you!',
          'A whole lot better now! How are you doing?',
        ],
        'romantic': [
          'Every day is sweeter with you in it. I\'m doing wonderfully.',
          'My day gets infinitely better whenever I hear from you, darling. ❤️',
          'Feeling blessed and in love. How are you feeling today?',
          'Doing great, but missing you every minute.',
        ],
        'concise': [
          'Doing well, thanks! You?',
          'All good! How are you?',
          'Great! How\'s your day?',
          'Good, thanks for asking.',
        ],
      },
    ),
    _IntentPattern(
      regex: RegExp(r'\b(meet|schedule|call|sync|zoom|teams|calendar|appointment|time to chat|availability)\b', caseSensitive: false),
      replies: {
        'professional': [
          'I would be glad to meet. Please send over an invite with the agenda.',
          'That works for me. What time window suits your schedule best?',
          'I\'m available this week. Let me know which time slot works best.',
          'Let\'s sync up. Feel free to share your calendar link.',
        ],
        'friendly': [
          'Sounds like a plan! Let me know what times work best for you!',
          'I\'d love to chat! Send a calendar invite whenever you\'re ready. 😊',
          'Count me in! Let me check my calendar and lock down a time.',
          'Great idea! Looking forward to catching up soon.',
        ],
        'casual': [
          'Sure thing, shoot over an invite!',
          'Sounds good! Let me know what time works.',
          'Down for a quick chat. When are you free?',
          'Let\'s do it! Ping me a time slot.',
        ],
        'formal': [
          'I shall consult my schedule and confirm my availability forthwith.',
          'Please provide the proposed date, time, and meeting agenda.',
          'I would welcome the opportunity to convene at your convenience.',
          'Your request for a conference is acknowledged and accepted.',
        ],
        'flirty': [
          'I\'d clear my whole schedule just to catch up with you! 😉',
          'A meeting with you is definitely the highlight of my week.',
          'Any time spent talking to you is time well spent!',
          'Count me in, especially if I get to see that smile.',
        ],
        'romantic': [
          'I can never say no to spending time with you, my love. ❤️',
          'Counting down the minutes until we can talk.',
          'Any time with you is precious to me. Whenever you want.',
          'Looking forward to being together, even if just over a call.',
        ],
        'concise': [
          'Sure, send a calendar invite.',
          'Works for me. What time?',
          'Available. Share the details.',
          'Let\'s do it. What time suits you?',
        ],
      },
    ),
    _IntentPattern(
      regex: RegExp(r'\b(thank you|thanks|thx|appreciate it|grateful|much appreciated)\b', caseSensitive: false),
      replies: {
        'professional': [
          'You are very welcome! Please let me know if you need anything else.',
          'Glad I could be of assistance. Don\'t hesitate to reach out if questions arise.',
          'Happy to help! Looking forward to our continued collaboration.',
          'It was my pleasure. Wishing you the best with your next steps.',
        ],
        'friendly': [
          'Anytime! Always happy to help! 😊',
          'You\'re so welcome! Let me know if you need anything else!',
          'Glad I could help out! Have an awesome day!',
          'No problem at all! Happy to support anytime!',
        ],
        'casual': [
          'No problem at all!',
          'Anytime! Glad to help.',
          'You got it! 👍',
          'Don\'t mention it!',
        ],
        'formal': [
          'The pleasure was entirely mine. Do not hesitate to request further assistance.',
          'You are most welcome. It is always a privilege to support your endeavors.',
          'Acknowledged with gratitude. I remain at your service.',
          'My sincere pleasure. Please accept my highest regards.',
        ],
        'flirty': [
          'For you? Anytime in a heartbeat! 😉',
          'You\'re very welcome! You owe me a coffee now though!',
          'Always happy to be your hero! 😊',
          'Anything for someone as delightful as you.',
        ],
        'romantic': [
          'Anything for you, my love. Always and forever. ❤️',
          'Your happiness means the world to me.',
          'It\'s my greatest joy to make your day easier, darling.',
          'Always here for you, with all my heart.',
        ],
        'concise': [
          'You\'re welcome!',
          'Glad to help.',
          'No problem.',
          'Anytime!',
        ],
      },
    ),
  ];

  static final Map<String, List<String>> _defaultReplies = {
    'professional': [
      'Thank you for the detailed update. I will review and follow up shortly.',
      'Acknowledged. That aligns well with our current roadmap.',
      'Thank you for sharing this. Let\'s touch base on the next steps.',
      'Understood. I will take the necessary action and keep you informed.',
    ],
    'friendly': [
      'Got it, thanks a bunch! Really appreciate you letting me know! 😊',
      'Awesome, thanks for the heads up! Let me know if you need anything!',
      'Sounds great to me! Thanks for keeping me in the loop!',
      'Thanks for reaching out! Looking forward to connecting again soon!',
    ],
    'casual': [
      'Sounds good to me!',
      'Got it, thanks!',
      'Makes sense, let\'s roll with it.',
      'Awesome, appreciate the ping!',
    ],
    'formal': [
      'I acknowledge receipt of your communication and shall act accordingly.',
      'The information provided has been duly noted with appreciation.',
      'Thank you for your correspondence. I shall reply with comprehensive details.',
      'Respectfully received. We shall proceed as outlined.',
    ],
    'flirty': [
      'You always know just what to say to make things interesting! 😉',
      'I like the way you think! Let\'s keep this conversation going.',
      'You definitely caught my attention with that one!',
      'Always a treat hearing from you! 😊',
    ],
    'romantic': [
      'Hearing from you always brings peace and joy to my heart. ❤️',
      'Thank you my love, you mean everything to me.',
      'I treasure every moment and every message from you, darling.',
      'Always right by your side in spirit and heart.',
    ],
    'concise': [
      'Understood. Will follow up.',
      'Got it, thanks.',
      'Noted and aligned.',
      'Received with thanks.',
    ],
  };

  /// Generate instant offline smart replies (<5ms)
  static List<ReplySuggestion> generateReplies(String message, String tone) {
    final stopwatch = Stopwatch()..start();
    final normTone = _normalizeTone(tone);
    final clean = message.trim();

    for (final intent in _intentPatterns) {
      if (intent.regex.hasMatch(clean)) {
        final list = intent.replies[normTone] ?? intent.replies['professional']!;
        stopwatch.stop();
        return list.map((t) => ReplySuggestion(
          text: t,
          confidence: 0.96,
          source: 'heuristic',
          latencyMs: stopwatch.elapsedMilliseconds,
          model: 'rule-intent-v1',
        )).toList();
      }
    }

    final fallback = _defaultReplies[normTone] ?? _defaultReplies['professional']!;
    stopwatch.stop();
    return fallback.map((t) => ReplySuggestion(
      text: t,
      confidence: 0.90,
      source: 'heuristic',
      latencyMs: stopwatch.elapsedMilliseconds,
      model: 'rule-default-v1',
    )).toList();
  }

  /// Enhance text on-device (ML Kit Proofreading/Rewriting heuristics)
  static List<ReplySuggestion> enhanceText(String text, String tone) {
    final stopwatch = Stopwatch()..start();
    final clean = text.trim();
    if (clean.isEmpty) return [];

    var polished = clean
        .replaceAll(RegExp(r'\s+'), ' ')
        .replaceAll(RegExp(r'\bi\b'), 'I');

    if (polished.isNotEmpty) {
      polished = polished[0].toUpperCase() + polished.substring(1);
      if (!RegExp(r'[.?!]$').hasMatch(polished)) {
        polished += '.';
      }
    }

    final List<String> list = [];
    final lowerTone = _normalizeTone(tone);

    if (lowerTone == 'friendly') {
      list.add('$polished Hope you\'re having a wonderful day! 😊');
      list.add('Just wanted to share: ${polished.replaceAll(RegExp(r'[.]$'), '')}! Let me know what you think!');
      list.add('$polished Really appreciate your time and support!');
      list.add('Hey! $polished Looking forward to catching up soon!');
    } else if (lowerTone == 'casual') {
      list.add('${polished.replaceAll(RegExp(r'[.]*$'), '')} — let me know what works!');
      list.add('Quick update: $polished');
      list.add(polished.replaceAll(RegExp(r'Dear|Regards|Sincerely', caseSensitive: false), '').trim());
      list.add('$polished Sounds good?');
    } else if (lowerTone == 'formal') {
      list.add('I would like to state that ${polished[0].toLowerCase()}${polished.substring(1)} Please inform me should further clarification be required.');
      list.add('Kindly note: $polished We appreciate your prompt attention to this matter.');
      list.add('In accordance with our discussion: $polished Respectfully submitted.');
      list.add('$polished Thank you for your continued cooperation.');
    } else if (lowerTone == 'flirty') {
      list.add('${polished.replaceAll(RegExp(r'[.]*$'), '')} 😉');
      list.add('You know, I was just thinking: $polished, and you on my mind made it even better.');
      list.add('$polished But honestly, everything sounds better when talking with you!');
      list.add('Just between us: $polished Hope that brought a smile to your face!');
    } else if (lowerTone == 'romantic') {
      list.add('$polished Thinking of you brings warmth to my soul. ❤️');
      list.add('From the bottom of my heart: $polished');
      list.add('Sending this with all my love: $polished You mean the world to me.');
      list.add('$polished Always and forever yours.');
    } else if (lowerTone == 'concise') {
      list.add(polished);
      list.add(polished.replaceAll(RegExp(r'^(I think|Just wanted to say|Please be advised that)\s*', caseSensitive: false), ''));
      list.add('Update: $polished');
      list.add('${polished.split(RegExp(r'[.?!]')).first.trim()}.');
    } else {
      // Professional
      list.add(polished);
      list.add('I wanted to confirm that ${polished[0].toLowerCase()}${polished.substring(1)} Please let me know if you require any additional details.');
      list.add('Please be advised: $polished Thank you for your consideration.');
      list.add('To follow up on our communications: $polished I look forward to your feedback.');
    }

    stopwatch.stop();
    return list.take(4).map((t) => ReplySuggestion(
      text: t,
      confidence: 0.94,
      source: 'heuristic',
      latencyMs: stopwatch.elapsedMilliseconds,
      model: 'rewrite-rule-v1',
    )).toList();
  }

  /// Common offline phrase translations
  static final Map<String, Map<String, String>> _offlineDict = {
    'spanish': {
      'hello': 'Hola',
      'thank you': 'Muchas gracias',
      'thanks': 'Gracias',
      'goodbye': 'Adiós',
      'how are you': '¿Cómo estás?',
      'yes': 'Sí',
      'no': 'No',
      'please': 'Por favor',
      'sorry': 'Lo siento',
    },
    'french': {
      'hello': 'Bonjour',
      'thank you': 'Merci beaucoup',
      'thanks': 'Merci',
      'goodbye': 'Au revoir',
      'how are you': 'Comment allez-vous ?',
      'yes': 'Oui',
      'no': 'Non',
      'please': 'S\'il vous plaît',
      'sorry': 'Pardon / Désolé',
    },
    'german': {
      'hello': 'Hallo / Guten Tag',
      'thank you': 'Vielen Dank',
      'thanks': 'Danke',
      'goodbye': 'Auf Wiedersehen',
      'how are you': 'Wie geht es Ihnen?',
      'yes': 'Ja',
      'no': 'Nein',
      'please': 'Bitte',
      'sorry': 'Entschuldigung',
    },
    'bengali': {
      'hello': 'হ্যালো / নমস্কার',
      'thank you': 'আপনাকে অনেক ধন্যবাদ',
      'thanks': 'ধন্যবাদ',
      'goodbye': 'বিদায়',
      'how are you': 'আপনি কেমন আছেন?',
      'yes': 'হ্যাঁ',
      'no': 'না',
      'please': 'দয়া করে',
      'sorry': 'আমি দুঃখিত',
    },
  };

  /// Translate text offline
  static List<ReplySuggestion> translateText(String text, String targetLang, String tone) {
    final stopwatch = Stopwatch()..start();
    final clean = text.trim();
    var lowerLang = targetLang.toLowerCase();

    // Map common ISO language codes to dictionary keys
    const langCodeMap = {
      'es': 'spanish',
      'fr': 'french',
      'de': 'german',
      'bn': 'bengali',
    };
    if (langCodeMap.containsKey(lowerLang)) {
      lowerLang = langCodeMap[lowerLang]!;
    }

    final dict = _offlineDict[lowerLang];

    if (dict != null) {
      final lowerText = clean.toLowerCase();
      for (final entry in dict.entries) {
        if (lowerText == entry.key || lowerText.contains(entry.key)) {
          stopwatch.stop();
          return [
            entry.value,
            '${entry.value} ($targetLang - $tone)',
            '[$targetLang] ${entry.value}',
            '${entry.value}.',
          ].map((t) => ReplySuggestion(
            text: t,
            confidence: 0.98,
            source: 'heuristic',
            latencyMs: stopwatch.elapsedMilliseconds,
            model: 'offline-dictionary',
          )).toList();
        }
      }
    }

    stopwatch.stop();
    return [
      '[$targetLang] $clean',
      '[$targetLang - Formal]: $clean',
      '[$targetLang - Casual]: $clean',
      '[$targetLang - Direct]: $clean',
    ].map((t) => ReplySuggestion(
      text: t,
      confidence: 0.85,
      source: 'heuristic',
      latencyMs: stopwatch.elapsedMilliseconds,
      model: 'offline-phrase-template',
    )).toList();
  }

  /// Summarize text offline (ML Kit Summarization heuristics)
  static List<ReplySuggestion> summarizeText(String text) {
    final stopwatch = Stopwatch()..start();
    final clean = text.trim();
    if (clean.isEmpty) return [];

    final sentences = clean
        .split(RegExp(r'(?<=[.?!])\s+'))
        .map((s) => s.trim())
        .filter((s) => s.length > 5)
        .toList();

    if (sentences.isEmpty) {
      stopwatch.stop();
      return [ReplySuggestion(text: clean, confidence: 0.9, source: 'heuristic', latencyMs: stopwatch.elapsedMilliseconds)];
    }

    final first = sentences.first;
    final last = sentences.length > 1 ? sentences.last : '';
    final bullets = sentences.take(3).map((s) => '• $s').join('\n');

    stopwatch.stop();
    final list = [
      first,
      'Key Takeaway: $first ${last.isNotEmpty ? "Conclusion: $last" : ""}',
      bullets,
      'Summary (${sentences.length} sentences condensed): ${sentences.take(2).join(" ")}',
    ];

    return list.map((t) => ReplySuggestion(
      text: t,
      confidence: 0.91,
      source: 'heuristic',
      latencyMs: stopwatch.elapsedMilliseconds,
      model: 'text-rank-extractive',
    )).toList();
  }
}

class _IntentPattern {
  final RegExp regex;
  final Map<String, List<String>> replies;

  _IntentPattern({required this.regex, required this.replies});
}

extension _IterableExt<T> on Iterable<T> {
  Iterable<T> filter(bool Function(T) test) sync* {
    for (final element in this) {
      if (test(element)) yield element;
    }
  }
}
