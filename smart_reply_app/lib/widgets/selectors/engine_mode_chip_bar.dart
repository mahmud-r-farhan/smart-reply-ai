import 'package:flutter/material.dart';
import '../../models/engine_mode.dart';
import '../../utils/app_theme.dart';

/// Horizontal Chip Bar for toggling Engine Mode
class EngineModeChipBar extends StatelessWidget {
  final EngineMode activeMode;
  final ValueChanged<EngineMode> onModeChanged;
  final VoidCallback? onSettingsPressed;

  const EngineModeChipBar({
    super.key,
    required this.activeMode,
    required this.onModeChanged,
    this.onSettingsPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: EngineMode.values.map((mode) {
                  final isSelected = mode == activeMode;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () => onModeChanged(mode),
                      borderRadius: BorderRadius.circular(12),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppTheme.primary.withValues(alpha: 0.25)
                              : AppTheme.backgroundLight.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? AppTheme.primary
                                : AppTheme.borderColor.withValues(alpha: 0.3),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              mode.shortTag,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? AppTheme.textPrimary : AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          if (onSettingsPressed != null) ...[
            const SizedBox(width: 8),
            IconButton(
              icon: Icon(Icons.tune_rounded, size: 20, color: AppTheme.accent),
              tooltip: 'Configure AI Provider',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              onPressed: onSettingsPressed,
            ),
          ],
        ],
      ),
    );
  }
}
