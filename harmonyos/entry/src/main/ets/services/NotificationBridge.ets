/**
 * NotificationBridge.ets
 * HarmonyOS Notification Kit & Smartwatch Bridge using @ohos.notificationManager
 *
 * Mirrors incoming messages to the notification centre and to Huawei Watch
 * (Watch GT / Watch 4 / Watch Fit) with up to three quick-reply action buttons.
 *
 * Every notification button must carry a WantAgent — without one the button is
 * not actionable (and fails schema validation), so the buttons are built from
 * real WantAgents that re-open the ability with the chosen reply attached.
 */

import notificationManager from '@ohos.notificationManager';
import wantAgent from '@ohos.app.ability.wantAgent';

/** Must match `bundleName` in AppScope/app.json5. */
const BUNDLE_NAME: string = 'com.smartreply.harmonyos';
const ENTRY_ABILITY: string = 'EntryAbility';

export class NotificationBridge {

  /**
   * Publishes a rich notification with quick action buttons displayed on the
   * Huawei Watch and in the notification centre.
   *
   * @returns true when the notification was published.
   */
  public static async publishWatchNotification(
    sender: string,
    message: string,
    replies: string[]
  ): Promise<boolean> {
    const notificationId = Math.floor(Math.random() * 100000);

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
      slotType: notificationManager.SlotType.SOCIAL_COMMUNICATION,
      isAlertOnce: false
    };

    // Tapping the notification body opens the app. Best effort: if the agent
    // cannot be created we still publish the notification itself.
    try {
      const bodyAgentInfo: wantAgent.WantAgentInfo = {
        wants: [
          {
            bundleName: BUNDLE_NAME,
            abilityName: ENTRY_ABILITY
          }
        ],
        operationType: wantAgent.OperationType.START_ABILITY,
        requestCode: 100,
        wantAgentFlags: [wantAgent.WantAgentFlags.UPDATE_PRESENT_FLAG]
      };
      notificationRequest.wantAgent = await wantAgent.getWantAgent(bodyAgentInfo);
    } catch (err) {
      console.warn(`[NotificationBridge] Body WantAgent unavailable: ${JSON.stringify(err)}`);
    }

    // Quick-reply buttons (maximum of three, per Notification Kit).
    try {
      const actionButtons = await NotificationBridge.buildActionButtons(replies);
      if (actionButtons.length > 0) {
        notificationRequest.actionButtons = actionButtons;
      }
    } catch (err) {
      console.warn(`[NotificationBridge] Action buttons unavailable: ${JSON.stringify(err)}`);
    }

    try {
      await notificationManager.publish(notificationRequest);
      return true;
    } catch (err) {
      console.error(`[NotificationBridge] Failed to publish notification: ${JSON.stringify(err)}`);
      return false;
    }
  }

  /**
   * Builds one actionable button per reply. Each button starts the ability with
   * the reply text in `parameters`, which EntryAbility/Index can read back from
   * `want.parameters.smartReply`.
   */
  private static async buildActionButtons(
    replies: string[]
  ): Promise<notificationManager.NotificationActionButton[]> {
    const actionButtons: notificationManager.NotificationActionButton[] = [];
    const limited = replies.slice(0, 3);

    for (let index = 0; index < limited.length; index++) {
      const replyText = limited[index];
      if (!replyText || replyText.trim().length === 0) {
        continue;
      }

      const buttonAgentInfo: wantAgent.WantAgentInfo = {
        wants: [
          {
            bundleName: BUNDLE_NAME,
            abilityName: ENTRY_ABILITY,
            parameters: {
              smartReply: replyText,
              smartReplySource: 'notification'
            }
          }
        ],
        operationType: wantAgent.OperationType.START_ABILITY,
        requestCode: 200 + index,
        wantAgentFlags: [wantAgent.WantAgentFlags.UPDATE_PRESENT_FLAG]
      };

      const agent = await wantAgent.getWantAgent(buttonAgentInfo);
      actionButtons.push({
        title: replyText,
        wantAgent: agent
      });
    }

    return actionButtons;
  }
}
