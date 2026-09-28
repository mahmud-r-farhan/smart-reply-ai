package com.smartreply.smart_reply_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput

/**
 * SmartReplyWatchReceiver
 * Handles smart reply taps from Wear OS smartwatches and connected wearables.
 */
class SmartReplyWatchReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmartReplyWatchReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra(SmartReplyWatchBridge.EXTRA_NOTIFICATION_ID, 0)
        val sender = intent.getStringExtra(SmartReplyWatchBridge.EXTRA_SENDER) ?: "Unknown"

        // 1. Extract reply text: either from RemoteInput (Wear OS pills) or Direct Action (Fitbit/Garmin)
        var replyText: String? = intent.getStringExtra(SmartReplyWatchBridge.EXTRA_CHOSEN_REPLY)

        if (replyText.isNullOrBlank()) {
            val remoteInputBundle = RemoteInput.getResultsFromIntent(intent)
            replyText = remoteInputBundle?.getCharSequence(SmartReplyWatchBridge.KEY_TEXT_REPLY)?.toString()
        }

        if (replyText.isNullOrBlank()) {
            Log.w(TAG, "No reply text found in intent")
            return
        }

        Log.i(TAG, "Received Smart Reply from smartwatch for $sender: \"$replyText\"")

        // 2. Dispatch the reply to active Flutter application UI
        MainActivity.dispatchWatchReply(sender, replyText)

        // 3. Update the notification on phone and watch to acknowledge receipt
        val acknowledgedNotification = NotificationCompat.Builder(context, SmartReplyWatchBridge.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("✓ Reply Sent via Watch")
            .setContentText("\"$replyText\" to $sender")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setTimeoutAfter(5000)
            .setAutoCancel(true)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(notificationId, acknowledgedNotification)
        } catch (e: SecurityException) {
            Log.e(TAG, "Notification permission error", e)
        }
    }
}
