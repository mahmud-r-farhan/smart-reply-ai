/**
 * NotificationBridge.ets
 * HarmonyOS Notification Kit & Smartwatch Bridge using @ohos.notificationManager
 * Mirrors notifications with quick action buttons to Huawei Watch GT / Watch 4 / Watch Fit
 */

import notificationManager from '@ohos.notificationManager';

export class NotificationBridge {

  /**
   * Publishes a rich notification with quick action buttons displayed on Huawei Watch
   */
  public static async publishWatchNotification(
    sender: string,
    message: string,
    replies: string[]
  ): Promise<boolean> {
    try {
      const notificationId = Math.floor(Math.random() * 100000);

      // Create notification action buttons for Huawei Watch and HarmonyOS notification center
      const actionButtons = replies.slice(0, 3).map((replyText, idx) => ({
        title: replyText,
        userInput: {
          inputKey: `reply_key_${idx}`
        }
      }));

      const notificationRequest: notificationManager.NotificationRequest = {
        id: notificationId,
        content: {
          contentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
          normal: {
            title: sender,
            text: message,
            additionalText: 'Smart Reply AI'
          }
        },
        actionButtons: actionButtons,
        notificationSlotType: notificationManager.SlotType.SOCIAL_COMMUNICATION,
        isAlertOnce: false
      };

      await notificationManager.publish(notificationRequest);
      return true;
    } catch (err) {
      console.error(`[NotificationBridge] Failed to publish notification: ${JSON.stringify(err)}`);
      return false;
    }
  }
}
