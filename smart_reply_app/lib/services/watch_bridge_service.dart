import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:smart_reply_app/services/heuristic_engine.dart';

/// WatchBridgeService
/// 
/// Manages communication between Flutter and Wear OS / Smartwatches.
/// - Posts notifications with WearableExtender and RemoteInput choice pills.
/// - Listens for replies sent from the smartwatch in real-time.
/// - Integrates with the on-device heuristic engine (< 5ms).
class WatchBridgeService {
  static const MethodChannel _channel =
      MethodChannel('com.smartreply.smart_reply_app/watch_bridge');

  static final StreamController<WatchReplyEvent> _replyStreamController =
      StreamController<WatchReplyEvent>.broadcast();

  static Stream<WatchReplyEvent> get replyStream => _replyStreamController.stream;

  static bool _initialized = false;

  /// Initialize MethodChannel listener
  static void initialize() {
    if (_initialized) return;
    _initialized = true;

    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onWatchReplyReceived') {
        final Map<dynamic, dynamic>? args = call.arguments as Map<dynamic, dynamic>?;
        if (args != null) {
          final sender = args['sender']?.toString() ?? 'Unknown';
          final reply = args['reply']?.toString() ?? '';
          final timestamp = args['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch;

          debugPrint('[WatchBridge] Received reply from smartwatch: "$reply" for $sender');

          _replyStreamController.add(WatchReplyEvent(
            sender: sender,
            reply: reply,
            timestamp: DateTime.fromMillisecondsSinceEpoch(timestamp),
          ));
        }
      }
    });
  }

  /// Post notification with smart reply choices visible on Wear OS watch screen
  static Future<bool> postNotificationForWatch({
    required String sender,
    required String message,
    List<String>? suggestions,
    String tone = 'friendly',
  }) async {
    try {
      // If suggestions are not explicitly provided, compute instant offline heuristics
      final replies = suggestions ??
          HeuristicEngine.generateReplies(message, tone)
              .map((s) => s.text)
              .take(3)
              .toList();

      if (defaultTargetPlatform == TargetPlatform.android) {
        final result = await _channel.invokeMethod<bool>('postWatchNotification', {
          'sender': sender,
          'message': message,
          'replies': replies,
        });
        return result ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('[WatchBridge] Failed to post watch notification: $e');
      return false;
    }
  }

  /// Check if the phone has granted Notification Listener permission
  static Future<bool> isNotificationListenerEnabled() async {
    if (defaultTargetPlatform != TargetPlatform.android) return false;
    try {
      final result = await _channel.invokeMethod<bool>('isNotificationListenerEnabled');
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Open Android system settings to enable notification access
  static Future<void> openNotificationListenerSettings() async {
    if (defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await _channel.invokeMethod('openNotificationListenerSettings');
    } catch (e) {
      debugPrint('[WatchBridge] Could not open notification settings: $e');
    }
  }

  /// Dispatches a demo message to test Wear OS smartwatch pill responses
  static Future<bool> sendTestNotificationToWatch() async {
    const sender = 'Alex (via WhatsApp)';
    const message = 'Hey! Are we still syncing up for coffee at 3 PM?';
    final replies = [
      'Sounds great, see you at 3! ☕',
      'Can we push to 3:30 PM?',
      'Sorry, let\'s catch up tomorrow!',
    ];

    return await postNotificationForWatch(
      sender: sender,
      message: message,
      suggestions: replies,
    );
  }
}

class WatchReplyEvent {
  final String sender;
  final String reply;
  final DateTime timestamp;

  WatchReplyEvent({
    required this.sender,
    required this.reply,
    required this.timestamp,
  });
}
