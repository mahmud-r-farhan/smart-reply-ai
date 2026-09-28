/**
 * ResultCard.ets
 * Native HarmonyOS ArkUI Suggestion Card Component with @ohos.pasteboard and @ohos.promptAction
 */

import pasteboard from '@ohos.pasteboard';
import promptAction from '@ohos.promptAction';
import { ReplySuggestion } from '../models/SmartReplyTypes';
import { NotificationBridge } from '../services/NotificationBridge';

@Component
export struct ResultCard {
  @Prop suggestion: ReplySuggestion;
  @Prop originalMessage: string;

  private copyToClipboard(text: string): void {
    const pasteData = pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN, text);
    const systemPasteboard = pasteboard.getSystemPasteboard();
    systemPasteboard.setData(pasteData, () => {
      promptAction.showToast({
        message: '✓ Copied to clipboard!',
        duration: 2000
      });
    });
  }

  private sendToWatch(replyText: string): void {
    NotificationBridge.publishWatchNotification(
      'Alex Mercer (WhatsApp)',
      this.originalMessage.length > 0 ? this.originalMessage : 'Meeting update',
      [replyText, 'Can we push by 15 mins?', 'Need to reschedule']
    ).then((success) => {
      promptAction.showToast({
        message: success ? '⌚ Dispatched to Huawei Watch!' : 'Notification posted',
        duration: 2500
      });
    });
  }

  build() {
    Column() {
      Row() {
        // Source indicator badge
        Row() {
          Text(this.suggestion.source === 'heuristic' ? '⚡ On-Device' : '☁️ Cloud LLM')
            .fontSize(11)
            .fontColor(this.suggestion.source === 'heuristic' ? '#34D399' : '#818CF8')
            .fontWeight(FontWeight.Medium)
        }
        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
        .backgroundColor(this.suggestion.source === 'heuristic' ? '#10B98120' : '#6366F120')
        .borderRadius(8)

        Blank()

        // Latency
        Text(`${this.suggestion.latencyMs}ms`)
          .fontSize(11)
          .fontColor('#94A3B8')
      }
      .width('100%')
      .margin({ bottom: 10 })

      // Suggestion content
      Text(this.suggestion.text)
        .fontSize(15)
        .fontColor('#F8FAFC')
        .lineHeight(22)
        .width('100%')
        .margin({ bottom: 12 })

      // Action row: Copy & Send to Watch
      Row({ space: 8 }) {
        Button('Copy Text')
          .fontSize(13)
          .fontColor('#F8FAFC')
          .backgroundColor('#334155')
          .height(34)
          .borderRadius(8)
          .layoutWeight(1)
          .onClick(() => {
            this.copyToClipboard(this.suggestion.text);
          })

        Button('⌚ Watch')
          .fontSize(13)
          .fontColor('#F8FAFC')
          .backgroundColor('#4F46E5')
          .height(34)
          .borderRadius(8)
          .onClick(() => {
            this.sendToWatch(this.suggestion.text);
          })
      }
      .width('100%')
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#1E293B')
    .borderRadius(14)
    .border({ width: 1, color: '#334155' })
    .margin({ bottom: 12 })
  }
}
