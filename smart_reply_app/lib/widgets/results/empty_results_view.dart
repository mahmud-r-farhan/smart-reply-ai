import 'package:flutter/material.dart';
import '../../utils/app_theme.dart';
import '../../utils/constants.dart';

/// Clean and helpful empty state view
class EmptyResultsView extends StatelessWidget {
  final String mode;

  const EmptyResultsView({
    super.key,
    required this.mode,
  });

  String get _title {
    switch (mode) {
      case AppMode.reply:
        return 'Ready to Generate Smart Replies';
      case AppMode.enhance:
        return 'Enhance and Proofread';
      case AppMode.translate:
        return 'Translate with Tone';
      case AppMode.summarize:
        return 'Rapid Text Summarization';
      default:
        return 'Ready to assist';
    }
  }

  String get _description {
    switch (mode) {
      case AppMode.reply:
        return 'Paste any received message to instantly get 4 high-context, tone-adjusted reply suggestions.';
      case AppMode.enhance:
        return 'Polish your draft for clarity, conciseness, grammar, and emotional impact.';
      case AppMode.translate:
        return 'Translate text with stylistic variations across Spanish, French, German, Bengali, and more.';
      case AppMode.summarize:
        return 'Condense emails, articles, or chats into crisp bullet points and executive takeaways.';
      default:
        return 'Select a mode and enter your text above.';
    }
  }

  IconData get _icon {
    switch (mode) {
      case AppMode.reply:
        return Icons.chat_bubble_outline_rounded;
      case AppMode.enhance:
        return Icons.auto_fix_high_rounded;
      case AppMode.translate:
        return Icons.translate_rounded;
      case AppMode.summarize:
        return Icons.summarize_outlined;
      default:
        return Icons.lightbulb_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.25)),
            ),
            child: Icon(_icon, size: 36, color: AppTheme.primaryLight),
          ),
          const SizedBox(height: 16),
          Text(
            _title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            _description,
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.textMuted.withValues(alpha: 0.7),
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
