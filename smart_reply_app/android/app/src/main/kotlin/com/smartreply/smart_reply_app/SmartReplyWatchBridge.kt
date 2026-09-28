package com.smartreply.smart_reply_app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput

/**
 * SmartReplyWatchBridge
 * Bridges smart replies to Wear OS & paired smartwatches.
 * 
 * Uses WearableExtender + RemoteInput with predefined choices.
 * On Wear OS, Android Wear, Galaxy Watch, and Pixel Watch:
 * - Displays incoming context message.
 * - Renders smart reply options as instant clickable pill buttons.
 * - Dispatches chosen reply directly to SmartReplyWatchReceiver.
 */
object SmartReplyWatchBridge {

    const val CHANNEL_ID = "smart_reply_wear_channel"
    const val CHANNEL_NAME = "Smart Reply Watch Notifications"
    const val KEY_TEXT_REPLY = "key_smart_reply_choice"
    const val ACTION_WATCH_REPLY = "com.smartreply.ACTION_WATCH_REPLY"
    const val EXTRA_NOTIFICATION_ID = "extra_notification_id"
    const val EXTRA_SENDER = "extra_sender"
    const val EXTRA_CHOSEN_REPLY = "extra_chosen_reply"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Sends instant smart reply suggestions to Wear OS and smartwatches"
                enableVibration(true)
                setShowBadge(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Post an interactive notification configured for Wear OS Smartwatches
     */
    fun postWatchNotification(
        context: Context,
        notificationId: Int,
        sender: String,
        message: String,
        smartReplies: List<String>
    ) {
        createNotificationChannel(context)

        // 1. Create RemoteInput with choices (Rendered as native Wear OS reply pills)
        val replyChoices = smartReplies.toTypedArray()
        val remoteInput = RemoteInput.Builder(KEY_TEXT_REPLY)
            .setLabel("Smart Reply...")
            .setChoices(replyChoices)
            .setAllowFreeFormInput(true) // Allows voice or keyboard reply on watch too
            .build()

        // 2. PendingIntent triggered when user taps any suggestion on watch
        val replyIntent = Intent(context, SmartReplyWatchReceiver::class.java).apply {
            action = ACTION_WATCH_REPLY
            putExtra(EXTRA_NOTIFICATION_ID, notificationId)
            putExtra(EXTRA_SENDER, sender)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val replyPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId,
            replyIntent,
            flags
        )

        // 3. Wearable action with RemoteInput
        val replyAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_send,
            "Smart Reply",
            replyPendingIntent
        )
            .addRemoteInput(remoteInput)
            .setAllowGeneratedReplies(true)
            .build()

        // 4. Wearable Extender specifically for Wear OS
        val wearableExtender = NotificationCompat.WearableExtender()
            .addAction(replyAction)
            .setContentAction(0)
            .setHintHideIcon(false)

        // 5. Build base notification with direct fallback action buttons
        // (Ensures compatibility with Pebble, Garmin, Amazfit, Fitbit that don't support full RemoteInput)
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Smart Reply: $sender")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .extend(wearableExtender)

        // Add each smart reply as a direct quick-action button on older/third-party watches
        smartReplies.take(3).forEachIndexed { index, reply ->
            val directIntent = Intent(context, SmartReplyWatchReceiver::class.java).apply {
                action = ACTION_WATCH_REPLY
                putExtra(EXTRA_NOTIFICATION_ID, notificationId)
                putExtra(EXTRA_SENDER, sender)
                putExtra(EXTRA_CHOSEN_REPLY, reply)
            }
            val directPendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId * 100 + index,
                directIntent,
                flags
            )
            builder.addAction(android.R.drawable.ic_menu_send, reply, directPendingIntent)
        }

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
}
