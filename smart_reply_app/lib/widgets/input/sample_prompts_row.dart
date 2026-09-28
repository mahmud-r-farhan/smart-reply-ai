import 'package:flutter/material.dart';
import '../../utils/app_theme.dart';
import '../../utils/constants.dart';

/// One-tap quick sample prompts for instant testing
class SamplePromptsRow extends StatelessWidget {
  final String mode;
  final ValueChanged<String> onSelectPrompt;

  const SamplePromptsRow({
    super.key,
    required this.mode,
    required this.onSelectPrompt,
  });

  List<String> get _samples {
    switch (mode) {
      case AppMode.reply:
        return [
          'Can we meet tomorrow at 3 PM?',
          'Thanks for the quick turnaround!',
          'Sorry for missing our call earlier.',
          'Please send over the updated slides.',
        ];
      case AppMode.enhance:
        return [
          'i want to ask if the project is done yet let me know',
          'we need to talk about the budget issue asap',
          'sorry for late reply was busy yesterday',
        ];
      case AppMode.translate:
        return [
          'Hello, it is a pleasure to meet you.',
          'Thank you very much for your kind support.',
          'Could we schedule a call next Monday?',
        ];
      case AppMode.summarize:
        return [
          'The team completed the Q3 sprint. Backend migration to multi-cloud completed with zero downtime. Customer satisfaction rose by 14%. Next sprint targets on-device ML.',
          'Meeting notes: Review budget by Friday. Finalize design system tokens. Submit pull request for smart reply engine.',
        ];
      default:
        return ['Hello! How are you today?'];
    }
  }

  @override
  Widget build(BuildContext context) {
    final samples = _samples;

    return SizedBox(
      height: 30,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: samples.length,
        itemBuilder: (context, index) {
          final prompt = samples[index];
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              onTap: () => onSelectPrompt(prompt),
              borderRadius: BorderRadius.circular(15),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLight.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.3)),
                ),
                alignment: Alignment.center,
                child: Text(
                  prompt,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted.withValues(alpha: 0.9),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
