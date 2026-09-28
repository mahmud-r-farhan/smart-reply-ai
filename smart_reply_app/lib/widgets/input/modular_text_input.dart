import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../utils/app_theme.dart';
import '../../utils/constants.dart';

/// Modular, high-performance Text Input area
class ModularTextInput extends StatefulWidget {
  final String input;
  final String mode;
  final bool loading;
  final String? error;
  final ValueChanged<String> onInputChanged;
  final VoidCallback onSubmit;
  final VoidCallback onClear;

  const ModularTextInput({
    super.key,
    required this.input,
    required this.mode,
    required this.loading,
    required this.error,
    required this.onInputChanged,
    required this.onSubmit,
    required this.onClear,
  });

  @override
  State<ModularTextInput> createState() => _ModularTextInputState();
}

class _ModularTextInputState extends State<ModularTextInput> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.input);
  }

  @override
  void didUpdateWidget(ModularTextInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.input != widget.input && _controller.text != widget.input) {
      _controller.text = widget.input;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String get _placeholder {
    switch (widget.mode) {
      case AppMode.reply:
        return 'Paste or type incoming message to generate replies...';
      case AppMode.enhance:
        return 'Enter text you want to polish, proofread, or rewrite...';
      case AppMode.translate:
        return 'Enter text you want to translate with style...';
      case AppMode.summarize:
        return 'Enter long message, email, or meeting notes to summarize...';
      default:
        return 'Enter text...';
    }
  }

  String get _submitLabel {
    if (widget.loading) return 'Generating...';
    switch (widget.mode) {
      case AppMode.reply:
        return 'Generate Replies';
      case AppMode.enhance:
        return 'Enhance Text';
      case AppMode.translate:
        return 'Translate';
      case AppMode.summarize:
        return 'Summarize';
      default:
        return 'Generate';
    }
  }

  Future<void> _handlePaste() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      widget.onInputChanged(data.text!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.input.trim().isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppTheme.surface.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: widget.error != null
                    ? AppTheme.error.withValues(alpha: 0.6)
                    : AppTheme.borderColor.withValues(alpha: 0.4),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Input TextField
                TextField(
                  controller: _controller,
                  onChanged: widget.onInputChanged,
                  maxLines: 5,
                  minLines: 3,
                  maxLength: 3000,
                  buildCounter: (context, {required currentLength, required isFocused, maxLength}) => null,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 14.5,
                    height: 1.5,
                    fontWeight: FontWeight.w400,
                  ),
                  decoration: InputDecoration(
                    hintText: _placeholder,
                    hintStyle: TextStyle(
                      color: AppTheme.textMuted.withValues(alpha: 0.6),
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                  ),
                ),

                // Action Bar inside field
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      // Quick paste
                      InkWell(
                        onTap: _handlePaste,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.content_paste_rounded, size: 14, color: AppTheme.textMuted.withValues(alpha: 0.8)),
                              const SizedBox(width: 4),
                              Text(
                                'Paste',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textMuted.withValues(alpha: 0.8),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      if (hasText) ...[
                        const SizedBox(width: 8),
                        InkWell(
                          onTap: widget.onClear,
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.clear_rounded, size: 14, color: AppTheme.textMuted.withValues(alpha: 0.8)),
                                const SizedBox(width: 4),
                                Text(
                                  'Clear',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textMuted.withValues(alpha: 0.8),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const Spacer(),

                      // Character count
                      Text(
                        '${widget.input.length}/3000',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Error banner
          if (widget.error != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline_rounded, size: 16, color: AppTheme.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.error!,
                      style: TextStyle(fontSize: 12, color: AppTheme.error),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Submit Action Button
          Container(
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: (widget.loading || !hasText) ? null : widget.onSubmit,
                borderRadius: BorderRadius.circular(14),
                child: Center(
                  child: widget.loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              _submitLabel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
