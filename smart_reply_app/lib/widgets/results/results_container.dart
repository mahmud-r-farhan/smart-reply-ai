import 'package:flutter/material.dart';
import '../../models/reply_suggestion.dart';
import '../../utils/app_theme.dart';
import 'modular_result_card.dart';

/// Container displaying all generated suggestions and actions
class ResultsContainer extends StatelessWidget {
  final List<ReplySuggestion> results;
  final String mode;
  final bool loading;
  final VoidCallback onRegenerate;

  const ResultsContainer({
    super.key,
    required this.results,
    required this.mode,
    required this.loading,
    required this.onRegenerate,
  });

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with count & regenerate button
          Row(
            children: [
              Text(
                'AI SUGGESTIONS (${results.length})',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: AppTheme.textMuted.withValues(alpha: 0.8),
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: loading ? null : onRegenerate,
                icon: Icon(Icons.refresh_rounded, size: 14, color: AppTheme.accent),
                label: Text(
                  'Regenerate',
                  style: TextStyle(fontSize: 12, color: AppTheme.accent, fontWeight: FontWeight.w600),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // List of suggestions
          ...results.asMap().entries.map((entry) {
            return ModularResultCard(
              suggestion: entry.value,
              index: entry.key,
            );
          }),
        ],
      ),
    );
  }
}
