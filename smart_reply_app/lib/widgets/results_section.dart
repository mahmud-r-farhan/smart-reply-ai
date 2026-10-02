import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/app_theme.dart';
import '../utils/constants.dart';

class ResultsSection extends StatefulWidget {
  final List<String> results;
  final String mode;
  final bool loading;
  final VoidCallback onRegenerate;

  const ResultsSection({
    super.key,
    required this.results,
    required this.mode,
    required this.loading,
    required this.onRegenerate,
  });

  @override
  State<ResultsSection> createState() => _ResultsSectionState();
}

class _ResultsSectionState extends State<ResultsSection> with SingleTickerProviderStateMixin {
  int? _copiedIndex;
  late AnimationController _animationController;

  String get _title {
    return widget.mode == AppMode.reply ? 'Suggested Replies' : 'Enhanced Versions';
  }

  String get _countLabel {
    return widget.mode == AppMode.reply ? 'replies' : 'versions';
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void didUpdateWidget(covariant ResultsSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Replay the entrance animation whenever a fresh batch of results arrives.
    if (widget.results.isNotEmpty && widget.results != oldWidget.results) {
      _animationController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _copyToClipboard(String text, int index) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() {
      _copiedIndex = index;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.check_circle_rounded,
              color: AppTheme.successColor,
              size: 20,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Copied to clipboard',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        backgroundColor: AppTheme.backgroundCard,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _copiedIndex = null;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.results.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header with regenerate button
        Row(
          children: [
            // Status indicator
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: AppTheme.successColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.successColor.withValues(alpha: 0.4),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                Text(
                  '${widget.results.length} $_countLabel generated',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                ),
              ],
            ),
            const Spacer(),
            // Regenerate Button
            GestureDetector(
              onTap: widget.loading ? null : widget.onRegenerate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.refresh_rounded,
                      size: 14,
                      color: AppTheme.primaryBlue,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Refresh',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Results List with animation
        AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.results.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = widget.results[index];
                final isCopied = _copiedIndex == index;
                
                return FadeTransition(
                  opacity: Tween<double>(begin: 0, end: 1).animate(
                    CurvedAnimation(
                      parent: _animationController,
                      curve: Interval(
                        (index * 0.1).clamp(0.0, 1.0),
                        ((index + 1) * 0.1).clamp(0.0, 1.0),
                      ),
                    ),
                  ),
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.1),
                      end: Offset.zero,
                    ).animate(
                      CurvedAnimation(
                        parent: _animationController,
                        curve: Interval(
                          (index * 0.1).clamp(0.0, 1.0),
                          ((index + 1) * 0.1).clamp(0.0, 1.0),
                        ),
                      ),
                    ),
                    child: GestureDetector(
                      onTap: () => _copyToClipboard(item, index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isCopied
                              ? AppTheme.primaryBlue.withValues(alpha: 0.08)
                              : AppTheme.backgroundLight.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isCopied
                                ? AppTheme.primaryBlue.withValues(alpha: 0.4)
                                : AppTheme.borderColor.withValues(alpha: 0.4),
                            width: 1,
                          ),
                          boxShadow: isCopied ? AppTheme.softShadow : null,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Number Badge
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                shape: BoxShape.circle,
                                boxShadow: AppTheme.softShadow,
                              ),
                              child: Center(
                                child: Text(
                                  '${index + 1}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            // Text Content
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  item,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.textSecondary,
                                    height: 1.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 5,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Copy Icon Button
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isCopied
                                    ? AppTheme.successColor.withValues(alpha: 0.15)
                                    : AppTheme.borderColor.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                isCopied ? Icons.check_rounded : Icons.copy_rounded,
                                size: 16,
                                color: isCopied ? AppTheme.successColor : AppTheme.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ],
    );
  }
}
