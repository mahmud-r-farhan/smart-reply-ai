import 'package:flutter/material.dart';
import '../../services/watch_bridge_service.dart';
import '../../utils/app_theme.dart';

class SmartwatchModal extends StatefulWidget {
  const SmartwatchModal({super.key});

  @override
  State<SmartwatchModal> createState() => _SmartwatchModalState();
}

class _SmartwatchModalState extends State<SmartwatchModal> {
  bool _isListenerEnabled = false;
  bool _isSending = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final enabled = await WatchBridgeService.isNotificationListenerEnabled();
    if (mounted) {
      setState(() {
        _isListenerEnabled = enabled;
      });
    }
  }

  Future<void> _sendTestToWatch() async {
    setState(() {
      _isSending = true;
      _statusMessage = null;
    });

    final success = await WatchBridgeService.sendTestNotificationToWatch();

    if (mounted) {
      setState(() {
        _isSending = false;
        _statusMessage = success
            ? '✓ Notification with Smart Reply pills sent to smartwatch!'
            : 'Notice: Test notification posted. Check your watch or notification bar.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: AppTheme.backgroundDark,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.watch_rounded,
                  color: Color(0xFF818CF8),
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Wear OS & Smartwatch Sync',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'Instant on-device suggestion pills on your wrist',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: AppTheme.textMuted),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Wear OS Smart Reply Feature Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome_rounded, color: Color(0xFF10B981), size: 18),
                    const SizedBox(width: 8),
                    const Text(
                      'How Smart Reply works on your Watch',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '1. An incoming message arrives (WhatsApp, Telegram, SMS, Slack).\n'
                  '2. Zero-latency offline engine computes 3-4 context-aware smart replies (< 5ms).\n'
                  '3. Your smartwatch displays the message with instant interactive suggestion pills.\n'
                  '4. Tap any pill on your watch to reply immediately without taking out your phone!',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: AppTheme.textSecondary.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Status & Test Action
          if (_statusMessage != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _statusMessage!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFD1FAE5)),
                    ),
                  ),
                ],
              ),
            ),

          // Action 1: Test Notification on Watch
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: _isSending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_to_mobile_rounded, size: 20),
              label: Text(_isSending ? 'Sending to Watch...' : 'Send Test Notification to Watch'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _isSending ? null : _sendTestToWatch,
            ),
          ),
          const SizedBox(height: 10),

          // Action 2: Messaging Auto-Replies Permission
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: Icon(
                _isListenerEnabled ? Icons.check_circle_rounded : Icons.notifications_active_rounded,
                color: _isListenerEnabled ? const Color(0xFF10B981) : const Color(0xFF818CF8),
                size: 20,
              ),
              label: Text(
                _isListenerEnabled
                    ? 'Messaging Notification Access: Active'
                    : 'Enable Auto-Reply for WhatsApp / SMS',
                style: TextStyle(
                  color: _isListenerEnabled ? const Color(0xFF10B981) : AppTheme.textPrimary,
                  fontSize: 13,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: _isListenerEnabled
                      ? const Color(0xFF10B981).withValues(alpha: 0.5)
                      : Colors.white.withValues(alpha: 0.2),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () async {
                await WatchBridgeService.openNotificationListenerSettings();
                Future.delayed(const Duration(seconds: 1), _checkPermission);
              },
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
