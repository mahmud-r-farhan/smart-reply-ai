package com.smartreply.smart_reply_app

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * WearableNotificationListenerService
 * 
 * Listens to incoming notifications from messaging apps (WhatsApp, Telegram, SMS, Slack, etc.).
 * Automatically extracts incoming message text, computes zero-latency smart replies,
 * and posts an actionable Wear OS notification with instant reply choices directly to the smartwatch!
 */
class WearableNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "WearableNotifListener"
        var isServiceActive = false
            private set

        // Targeted messaging packages
        private val MESSAGING_PACKAGES = setOf(
            "com.whatsapp",
            "com.whatsapp.w4b",
            "org.telegram.messenger",
            "com.google.android.apps.messaging",
            "com.samsung.android.messaging",
            "com.slack",
            "com.discord",
            "com.facebook.orca", // Messenger
            "com.microsoft.teams"
        )
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        isServiceActive = true
        Log.i(TAG, "Notification listener connected - Smartwatch auto-reply active.")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        isServiceActive = false
        Log.i(TAG, "Notification listener disconnected.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val pkg = sbn.packageName
        // Only process notifications from messaging apps
        if (!MESSAGING_PACKAGES.contains(pkg)) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: "Incoming Message"
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: return

        // Skip empty or purely system messages
        if (text.isBlank() || text.length < 2) return

        Log.i(TAG, "Intercepted message from $pkg ($title): \"$text\"")

        // 1. Generate zero-latency smart replies using rule heuristics
        val smartReplies = generateHeuristicReplies(text)

        // 2. Post actionable notification formatted for Wear OS smartwatch
        SmartReplyWatchBridge.postWatchNotification(
            applicationContext,
            sbn.id,
            title,
            text,
            smartReplies
        )
    }

    /**
     * Fast on-device heuristic generator for instant smartwatch pills (< 1ms)
     */
    private fun generateHeuristicReplies(message: String): List<String> {
        val lower = message.lowercase().trim()

        return when {
            lower.contains("hi") || lower.contains("hello") || lower.contains("hey") || lower.contains("good morning") -> {
                listOf(
                    "Hey there! How are you doing? 😊",
                    "Hello! What can I do for you today?",
                    "Hi! Great to hear from you."
                )
            }
            lower.contains("how are you") || lower.contains("how's it going") -> {
                listOf(
                    "Doing well, thank you! How are things with you?",
                    "All good here! Hope you're having a great day.",
                    "Great! Thanks for asking."
                )
            }
            lower.contains("meet") || lower.contains("schedule") || lower.contains("call") || lower.contains("time") -> {
                listOf(
                    "Sounds good! Let me know what time works best for you. 👍",
                    "I am free tomorrow afternoon. Does 2 PM work?",
                    "Can we reschedule for later this week?"
                )
            }
            lower.contains("thank") || lower.contains("thx") -> {
                listOf(
                    "You're very welcome! Always happy to help. 😊",
                    "Anytime! Let me know if you need anything else.",
                    "No problem at all! 👍"
                )
            }
            lower.contains("where are you") || lower.contains("eta") || lower.contains("when") -> {
                listOf(
                    "On my way now! Will be there shortly.",
                    "Arriving in about 10-15 minutes.",
                    "Running a few minutes late, see you soon!"
                )
            }
            lower.endsWith("?") -> {
                listOf(
                    "Yes, that sounds like a great plan!",
                    "I will check and get back to you shortly.",
                    "Not at the moment, but let's revisit soon."
                )
            }
            else -> {
                listOf(
                    "Got it, thank you for the update!",
                    "Sounds good to me! Let's do it.",
                    "Understood. I will follow up shortly."
                )
            }
        }
    }
}
