import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/reply_suggestion.dart';
import '../../utils/app_theme.dart';
import '../common/latency_badge.dart';

/// High-performance, modular result card for an individual suggestion
class ModularResultCard extends StatefulWidget {
  final ReplySuggestion suggestion;
  final int index;
  final VoidCallback? onUse;

  const ModularResultCard({
    super.key,
    required this.suggestion,
    required this.index,
    this.onUse,
  });

  @override
  State<ModularResultCard> createState() => _ModularResultCardState();
}

class _ModularResultCardState extends State<ModularResultCard> {
  bool _copied = false;

  Future<void> _copyToClipboard() async {
    await Clipboard.setData(ClipboardData(text: widget.suggestion.text));
    if (!mounted) return;
    setState(() => _copied = true);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Copied to clipboard!',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.backgroundDark,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _copied
              ? const Color(0xFF10B981).withValues(alpha: 0.6)
              : AppTheme.borderColor.withValues(alpha: 0.4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _copyToClipboard,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row with Index pill, Latency badge, and Copy icon
                Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.18),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${widget.index + 1}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primaryLight,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    LatencyBadge(
                      latencyMs: widget.suggestion.latencyMs,
                      source: widget.suggestion.source,
                      model: widget.suggestion.model,
                    ),
                    const Spacer(),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: _copied
                          ? const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_rounded, size: 16, color: Color(0xFF10B981)),
                                SizedBox(width: 4),
                                Text(
                                  'Copied',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            )
                          : Icon(
                              Icons.copy_rounded,
                              size: 16,
                              color: AppTheme.textMuted.withValues(alpha: 0.7),
                            ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Suggestion text content
                Text(
                  widget.suggestion.text,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 14.5,
                    height: 1.5,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
