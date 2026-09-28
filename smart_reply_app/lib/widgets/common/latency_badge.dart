import 'package:flutter/material.dart';
import '../../utils/app_theme.dart';

/// Modular badge displaying latency and suggestion provenance
class LatencyBadge extends StatelessWidget {
  final int latencyMs;
  final String source;
  final String? model;

  const LatencyBadge({
    super.key,
    required this.latencyMs,
    required this.source,
    this.model,
  });

  bool get _isLocal => source == 'heuristic' || source == 'mlkit' || source == 'onnx';

  @override
  Widget build(BuildContext context) {
    final themeColor = _isLocal ? const Color(0xFF10B981) : AppTheme.accent;
    final icon = _isLocal ? Icons.bolt_rounded : Icons.cloud_done_rounded;
    final label = _isLocal
        ? 'On-Device ${latencyMs}ms'
        : 'Cloud ${latencyMs}ms${model != null ? ' ($model)' : ''}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: themeColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: themeColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: themeColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: themeColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
