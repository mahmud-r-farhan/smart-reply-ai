/**
 * Index.ets
 * Main Native HarmonyOS ArkUI Dashboard for Smart Reply AI
 */

import promptAction from '@ohos.promptAction';
import { AppMode, EngineMode, ReplySuggestion, ToneStyle, SUPPORTED_LANGUAGES } from '../models/SmartReplyTypes';
import { HeuristicEngine } from '../services/HeuristicEngine';
import { CloudEngine } from '../services/CloudEngine';
import { NotificationBridge } from '../services/NotificationBridge';
import { ResultCard } from '../components/ResultCard';

@Entry
@Component
struct Index {
  @State currentMode: AppMode = 'reply';
  @State selectedTone: ToneStyle = 'friendly';
  @State engineMode: EngineMode = 'hybrid';
  @State inputText: string = 'Can we meet tomorrow at 3 PM to review the project roadmap?';
  @State targetLanguage: string = 'es';
  @State suggestions: ReplySuggestion[] = [];
  @State isLoading: boolean = false;
  @State statusBanner: string = '';

  private tones: ToneStyle[] = ['friendly', 'professional', 'casual', 'concise', 'formal', 'flirty', 'romantic'];

  aboutToAppear() {
    this.executeGeneration();
  }

  private setMode(mode: AppMode): void {
    this.currentMode = mode;
    this.executeGeneration();
  }

  private setTone(tone: ToneStyle): void {
    this.selectedTone = tone;
    this.executeGeneration();
  }

  private testHuaweiWatchNotification(): void {
    NotificationBridge.publishWatchNotification(
      'Sarah Lin (Huawei Health)',
      'Are we still on for the sync meeting?',
      ['Yes, see you then!', 'Can we push by 15m?', 'I will have to reschedule']
    ).then((success) => {
      promptAction.showToast({
        message: success ? '⌚ Dispatched test notification to Huawei Watch!' : 'Notification error',
        duration: 3000
      });
    });
  }

  private executeGeneration(): void {
    if (!this.inputText || this.inputText.trim().length === 0) {
      this.suggestions = [];
      return;
    }

    this.isLoading = true;

    // Instant on-device heuristics (< 1ms)
    let localReplies: ReplySuggestion[] = [];
    if (this.currentMode === 'reply') {
      localReplies = HeuristicEngine.generateReplies(this.inputText, this.selectedTone);
    } else if (this.currentMode === 'enhance') {
      localReplies = HeuristicEngine.enhanceText(this.inputText, this.selectedTone);
    } else if (this.currentMode === 'translate') {
      localReplies = HeuristicEngine.translateText(this.inputText, this.targetLanguage, this.selectedTone);
    } else if (this.currentMode === 'summarize') {
      localReplies = HeuristicEngine.summarizeText(this.inputText);
    }

    this.suggestions = localReplies;
    this.isLoading = false;

    // Hybrid mode: keep the instant local answer and upgrade it when the
    // cloud response lands. Cloud mode: replace once the response arrives.
    if (this.engineMode === 'cloud' || this.engineMode === 'hybrid') {
      if (!CloudEngine.hasCredentials()) {
        this.statusBanner = this.engineMode === 'cloud'
          ? 'No cloud API key configured — showing on-device suggestions'
          : 'On-device suggestions (add a cloud API key to enable upgrades)';
        return;
      }

      this.isLoading = true;
      this.statusBanner = 'Cloud request in flight…';
      CloudEngine.queryCloud(
        this.inputText,
        `Generate ${this.selectedTone} smart replies for: "${this.inputText}"`
      ).then((cloudReplies) => {
        if (cloudReplies.length > 0) {
          this.suggestions = cloudReplies;
          this.statusBanner = 'Cloud LLM response (upgraded from on-device)';
        } else {
          this.statusBanner = 'Cloud returned no usable answer — showing on-device suggestions';
        }
        this.isLoading = false;
      }).catch((err) => {
        console.error(`Cloud error: ${JSON.stringify(err)}`);
        this.statusBanner = 'Cloud unavailable — showing on-device suggestions';
        this.isLoading = false;
      });
    } else {
      this.statusBanner = 'Offline mode — zero-network on-device suggestions';
    }
  }

  build() {
    Column() {
      // Header Bar
      Row() {
        Column({ space: 4 }) {
          Row({ space: 8 }) {
            Text('Smart Reply AI')
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor('#F8FAFC')

            Text('HarmonyOS')
              .fontSize(11)
              .fontColor('#60A5FA')
              .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              .backgroundColor('#3B82F620')
              .borderRadius(6)
          }

          Text('Native ArkUI • On-Device & Cloud Intelligence')
            .fontSize(12)
            .fontColor('#94A3B8')
        }
        .alignItems(HorizontalAlign.Start)

        Blank()

        // Watch test sync button
        Button('⌚ Watch Sync')
          .fontSize(12)
          .fontColor('#FFFFFF')
          .backgroundColor('#4F46E5')
          .height(34)
          .borderRadius(10)
          .onClick(() => {
            this.testHuaweiWatchNotification();
          })
      }
      .width('100%')
      .padding({ left: 20, right: 20, top: 16, bottom: 16 })
      .backgroundColor('#0F172A')

      Scroll() {
        Column({ space: 16 }) {
          // Mode Tabs (Reply, Enhance, Translate, Summarize)
          Row({ space: 8 }) {
            this.ModeTab('💬 Reply', 'reply')
            this.ModeTab('✨ Enhance', 'enhance')
            this.ModeTab('🌐 Translate', 'translate')
            this.ModeTab('📑 Summarize', 'summarize')
          }
          .width('100%')
          .padding({ left: 16, right: 16 })

          // Tone Selector (Professional, Friendly, Casual, Concise, Formal, Romantic)
          Scroll() {
            Row({ space: 8 }) {
              ForEach(this.tones, (tone: ToneStyle) => {
                Button(tone.charAt(0).toUpperCase() + tone.slice(1))
                  .fontSize(12)
                  .fontColor(this.selectedTone === tone ? '#FFFFFF' : '#94A3B8')
                  .backgroundColor(this.selectedTone === tone ? '#3B82F6' : '#1E293B')
                  .height(32)
                  .borderRadius(8)
                  .onClick(() => {
                    this.setTone(tone);
                  })
              })
            }
          }
          .scrollable(ScrollDirection.Horizontal)
          .scrollBar(BarState.Off)
          .width('100%')
          .padding({ left: 16, right: 16 })

          // Input Area Card
          Column() {
            Row() {
              Text('Incoming Message or Draft')
                .fontSize(13)
                .fontWeight(FontWeight.Medium)
                .fontColor('#CBD5E1')

              Blank()

              Text(`${this.inputText.length} chars`)
                .fontSize(11)
                .fontColor('#64748B')
            }
            .width('100%')
            .margin({ bottom: 8 })

            TextArea({ text: this.inputText, placeholder: 'Enter received message...' })
              .fontSize(14)
              .fontColor('#F8FAFC')
              .backgroundColor('#0F172A')
              .borderRadius(10)
              .height(90)
              .onChange((val: string) => {
                this.inputText = val;
              })

            Row({ space: 8 }) {
              Button('Clear')
                .fontSize(12)
                .fontColor('#94A3B8')
                .backgroundColor('#334155')
                .height(32)
                .borderRadius(8)
                .onClick(() => {
                  this.inputText = '';
                  this.suggestions = [];
                })

              Blank()

              Button(this.isLoading ? 'Processing...' : '⚡ Generate Suggestions')
                .fontSize(13)
                .fontColor('#FFFFFF')
                .backgroundColor('#2563EB')
                .height(36)
                .borderRadius(8)
                .onClick(() => {
                  this.executeGeneration();
                })
            }
            .width('100%')
            .margin({ top: 10 })
          }
          .width('100%')
          .padding(16)
          .backgroundColor('#1E293B')
          .borderRadius(16)
          .border({ width: 1, color: '#334155' })
          .margin({ left: 16, right: 16 })

          // Results Section
          Column() {
            Row() {
              Text('Smart Suggestions')
                .fontSize(16)
                .fontWeight(FontWeight.Bold)
                .fontColor('#F8FAFC')

              Blank()

              Text(`${this.suggestions.length} generated`)
                .fontSize(12)
                .fontColor('#94A3B8')
            }
            .width('100%')
            .margin({ bottom: 12 })

            if (this.statusBanner.length > 0) {
              Text(this.statusBanner)
                .fontSize(11)
                .fontColor('#93C5FD')
                .padding({ left: 10, right: 10, top: 6, bottom: 6 })
                .backgroundColor('#1E3A8A40')
                .borderRadius(8)
                .width('100%')
                .margin({ bottom: 10 })
            }

            ForEach(this.suggestions, (item: ReplySuggestion) => {
              ResultCard({
                suggestion: item,
                originalMessage: this.inputText
              })
            })
          }
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 24 })
        }
        .width('100%')
      }
      .layoutWeight(1)
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#0B1120')
  }

  @Builder
  ModeTab(label: string, mode: AppMode) {
    Button(label)
      .fontSize(12)
      .fontColor(this.currentMode === mode ? '#FFFFFF' : '#94A3B8')
      .backgroundColor(this.currentMode === mode ? '#2563EB' : '#1E293B')
      .height(36)
      .borderRadius(10)
      .layoutWeight(1)
      .onClick(() => {
        this.setMode(mode);
      })
  }
}
