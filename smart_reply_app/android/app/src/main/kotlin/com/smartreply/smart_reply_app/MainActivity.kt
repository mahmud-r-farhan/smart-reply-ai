package com.smartreply.smart_reply_app

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    companion object {
        private const val CHANNEL_NAME = "com.smartreply.smart_reply_app/watch_bridge"
        private var methodChannel: MethodChannel? = null

        /**
         * Dispatches a reply tapped on the Wear OS smartwatch back to the running Flutter app
         */
        fun dispatchWatchReply(sender: String, reply: String) {
            methodChannel?.invokeMethod("onWatchReplyReceived", mapOf(
                "sender" to sender,
                "reply" to reply,
                "timestamp" to System.currentTimeMillis()
            ))
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME).apply {
            setMethodCallHandler { call, result ->
                when (call.method) {
                    "postWatchNotification" -> {
                        val sender = call.argument<String>("sender") ?: "Smart Reply AI"
                        val message = call.argument<String>("message") ?: ""
                        val replies = call.argument<List<String>>("replies") ?: listOf(
                            "Yes, sounds good!",
                            "I'll look into this.",
                            "Let me get back to you shortly."
                        )
                        val notificationId = (System.currentTimeMillis() % 100000).toInt()

                        SmartReplyWatchBridge.postWatchNotification(
                            applicationContext,
                            notificationId,
                            sender,
                            message,
                            replies
                        )
                        result.success(true)
                    }

                    "isNotificationListenerEnabled" -> {
                        val flat = Settings.Secure.getString(
                            contentResolver,
                            "enabled_notification_listeners"
                        )
                        val isEnabled = flat != null && flat.contains(packageName)
                        result.success(isEnabled)
                    }

                    "openNotificationListenerSettings" -> {
                        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(intent)
                        result.success(true)
                    }

                    else -> result.notImplemented()
                }
            }
        }
    }

    override fun onDestroy() {
        methodChannel = null
        super.onDestroy()
    }
}
