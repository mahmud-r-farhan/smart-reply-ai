import 'package:flutter/material.dart';
import '../../utils/app_theme.dart';
import '../../utils/constants.dart';

/// Dropdown selector for translation target language
class LanguagePicker extends StatelessWidget {
  final String currentLanguage;
  final ValueChanged<String> onLanguageChanged;

  const LanguagePicker({
    super.key,
    required this.currentLanguage,
    required this.onLanguageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.surface.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Icon(Icons.translate_rounded, size: 18, color: AppTheme.secondary),
            const SizedBox(width: 8),
            Text(
              'Target Language:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: SupportedLanguages.list.any((l) => l.name == currentLanguage)
                      ? currentLanguage
                      : SupportedLanguages.list.first.name,
                  dropdownColor: AppTheme.backgroundDark,
                  borderRadius: BorderRadius.circular(14),
                  icon: Icon(Icons.arrow_drop_down_rounded, color: AppTheme.accent),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  items: SupportedLanguages.list.map((lang) {
                    return DropdownMenuItem<String>(
                      value: lang.name,
                      child: Row(
                        children: [
                          Text(lang.flag, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(lang.name),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) onLanguageChanged(val);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
