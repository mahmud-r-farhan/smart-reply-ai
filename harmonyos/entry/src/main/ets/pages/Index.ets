/**
 * Index.ets
 * Main Native HarmonyOS ArkUI Dashboard for Smart Reply AI
 */

import promptAction from '@ohos.promptAction';
import { AppMode, EngineMode, LanguageOption, ProviderConfig, ReplySuggestion, ToneStyle,
  SUPPORTED_LANGUAGES } from '../models/SmartReplyTypes';
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

  // Cloud provider settings (BYOK). Kept as separate primitives so ArkUI
  // re-renders reliably when a field changes.
  @State providerName: string = 'Groq Cloud';
  @State providerBaseUrl: string = 'https://api.groq.com/openai/v1';
  @State providerModel: string = 'llama-3.1-8b-instant';
  @State providerApiKey: string = '';
  @State showProviderPanel: boolean = false;

  /**
   * Request counter: a slow cloud answer from an earlier tap must never
   * overwrite the results of the most recent one.
   */
  private requestSeq: number = 0;

  private tones: ToneStyle[] = ['friendly', 'professional', 'casual', 'concise', 'formal', 'flirty', 'romantic'];
  private engineModes: EngineMode[] = ['offline', 'hybrid', 'cloud'];

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

  private setEngineMode(mode: EngineMode): void {
    this.engineMode = mode;
    this.executeGeneration();
  }

  private setLanguage(code: string): void {
    this.targetLanguage = code;
    if (this.currentMode === 'translate') {
      this.executeGeneration();
    }
  }

  private engineModeLabel(mode: EngineMode): string {
    if (mode === 'offline') return '🔒 Offline';
    if (mode === 'cloud') return '☁️ Cloud';
    return '⚡ Hybrid';
  }

  /** Explicitly typed so ArkTS accepts the literal at every call site. */
  private currentProvider(): ProviderConfig {
    return {
      id: 'custom',
      name: this.providerName,
      baseUrl: this.providerBaseUrl.trim(),
      model: this.providerModel.trim(),
      apiKey: this.providerApiKey.trim()
    };
  }

  private languageName(code: string): string {
    const match = SUPPORTED_LANGUAGES.find((item: LanguageOption) => item.code === code);
    return match ? match.name : code;
  }

  private testHuaweiWatchNotification(): void {
    NotificationBridge.publishWatchNotification(
      'Sarah Lin (Huawei Health)',
      'Are we still on for the sync meeting?',
      ['Yes, see you then!', 'Can we push by 15m?', 'I will have to reschedule']
    ).then((success: boolean) => {
      promptAction.showToast({
        message: success ? '⌚ Dispatched test notification to Huawei Watch!' : 'Notification error',
        duration: 3000
      });
    });
  }

  /** Instant on-device answer for the active mode (< 1 ms). */
  private generateLocalReplies(text: string): ReplySuggestion[] {
    if (this.currentMode === 'enhance') {
      return HeuristicEngine.enhanceText(text, this.selectedTone);
    }
    if (this.currentMode === 'translate') {
      return HeuristicEngine.translateText(text, this.targetLanguage, this.selectedTone);
    }
    if (this.currentMode === 'summarize') {
      return HeuristicEngine.summarizeText(text);
    }
    return HeuristicEngine.generateReplies(text, this.selectedTone);
  }

  /** Mode-aware cloud prompt (previously every mode sent the reply prompt). */
  private buildPrompt(text: string): string {
    if (this.currentMode === 'enhance') {
      return `Text to enhance: "${text}"\nTask: rewrite it in a ${this.selectedTone} tone. ` +
        'Output strictly a JSON array of 4 strings.';
    }
    if (this.currentMode === 'translate') {
      return `Translate into ${this.languageName(this.targetLanguage)} (${this.selectedTone} tone):\n"${text}"\n` +
        'Output strictly a JSON array of 4 variations.';
    }
    if (this.currentMode === 'summarize') {
      return `Summarize the following text:\n"${text}"\n` +
        'Give an executive summary, a key takeaway and a bullet recap. ' +
        'Output strictly a JSON array of 4 strings.';
    }
    return `Context message: "${text}"\nTask: Generate 4 distinct smart replies in tone ` +
      `"${this.selectedTone}". Output strictly a JSON array of strings.`;
  }

  private executeGeneration(): void {
    const text = this.inputText.trim();
    if (text.length === 0) {
      this.suggestions = [];
      this.isLoading = false;
      this.statusBanner = '';
      return;
    }

    this.requestSeq += 1;
    const seq = this.requestSeq;
    this.isLoading = true;

    const localReplies = this.generateLocalReplies(text);

    // 1. Offline mode: never touches the network.
    if (this.engineMode === 'offline') {
      this.suggestions = localReplies;
      this.statusBanner = 'Offline mode — zero-network on-device suggestions';
      this.isLoading = false;
      return;
    }

    // 2. Cloud modes need a usable provider; otherwise the instant on-device
    //    answer is the honest result.
    const provider: ProviderConfig = this.currentProvider();

    if (!CloudEngine.hasCredentials(provider)) {
      this.suggestions = localReplies;
      this.isLoading = false;
      this.statusBanner = this.engineMode === 'cloud'
        ? 'No cloud API key configured — showing on-device suggestions'
        : 'On-device suggestions (add a cloud API key to enable upgrades)';
      return;
    }

    // 3. Hybrid keeps the instant answer visible while the cloud call lands;
    //    Cloud-only waits for the model answer and falls back if it fails.
    if (this.engineMode === 'hybrid') {
      this.suggestions = localReplies;
      this.statusBanner = 'Cloud request in flight…';
    } else {
      this.suggestions = [];
      this.statusBanner = 'Querying cloud LLM…';
    }

    CloudEngine.queryCloud(this.buildPrompt(text), this.buildSystemInstruction(), provider)
      .then((cloudReplies: ReplySuggestion[]) => {
        if (seq !== this.requestSeq) {
          return; // superseded by a newer request
        }
        if (cloudReplies.length > 0) {
          this.suggestions = cloudReplies;
          this.statusBanner = this.engineMode === 'hybrid'
            ? 'Cloud LLM response (upgraded from on-device)'
            : 'Cloud LLM response';
        } else {
          this.suggestions = localReplies;
          this.statusBanner = 'Cloud returned no usable answer — showing on-device suggestions';
        }
        this.isLoading = false;
      })
      .catch((err: Error) => {
        if (seq !== this.requestSeq) {
          return;
        }
        console.error(`Cloud error: ${JSON.stringify(err)}`);
        this.suggestions = localReplies;
        this.statusBanner = 'Cloud unavailable — showing on-device suggestions';
        this.isLoading = false;
      });
  }

  private buildSystemInstruction(): string {
    if (this.currentMode === 'enhance') {
      return 'You are a professional editor. Return strictly a JSON array of 4 enhanced variations.';
    }
    if (this.currentMode === 'translate') {
      return `You are a native translator in ${this.languageName(this.targetLanguage)}. ` +
        'Return strictly a JSON array of 4 strings.';
    }
    if (this.currentMode === 'summarize') {
      return 'You are an executive summarization assistant. Return strictly a JSON array of strings.';
    }
    return 'You are a smart conversational assistant. Return strictly a JSON array of reply strings.';
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

          // Engine Mode Selector (Offline / Hybrid / Cloud)
          Row({ space: 8 }) {
            ForEach(this.engineModes, (mode: EngineMode) => {
              Button(this.engineModeLabel(mode))
                .fontSize(12)
                .fontColor(this.engineMode === mode ? '#FFFFFF' : '#94A3B8')
                .backgroundColor(this.engineMode === mode ? '#4F46E5' : '#1E293B')
                .height(32)
                .borderRadius(8)
                .layoutWeight(1)
                .onClick(() => {
                  this.setEngineMode(mode);
                })
            })
          }
          .width('100%')
          .padding({ left: 16, right: 16 })

          // Cloud provider configuration (required for Hybrid / Cloud modes)
          Row() {
            Text(`Cloud: ${this.providerApiKey.length > 0 ? 'API key set' : 'no API key'} · ${this.providerModel}`)
              .fontSize(11)
              .fontColor(this.providerApiKey.length > 0 ? '#34D399' : '#94A3B8')
              .layoutWeight(1)
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })

            Button(this.showProviderPanel ? 'Hide settings' : '⚙️ Provider')
              .fontSize(11)
              .fontColor('#93C5FD')
              .backgroundColor('#1E3A8A40')
              .height(28)
              .borderRadius(8)
              .onClick(() => {
                this.showProviderPanel = !this.showProviderPanel;
              })
          }
          .width('100%')
          .padding({ left: 16, right: 16 })

          if (this.showProviderPanel) {
            Column({ space: 8 }) {
              Text('Cloud provider (BYOK)')
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#CBD5E1')
                .width('100%')

              TextInput({ text: this.providerBaseUrl, placeholder: 'https://api.groq.com/openai/v1' })
                .fontSize(12)
                .fontColor('#F8FAFC')
                .backgroundColor('#0F172A')
                .borderRadius(8)
                .height(38)
                .onChange((value: string) => {
                  this.providerBaseUrl = value;
                })

              TextInput({ text: this.providerModel, placeholder: 'llama-3.1-8b-instant' })
                .fontSize(12)
                .fontColor('#F8FAFC')
                .backgroundColor('#0F172A')
                .borderRadius(8)
                .height(38)
                .onChange((value: string) => {
                  this.providerModel = value;
                })

              TextInput({ text: this.providerApiKey, placeholder: 'API key (stored on device only)' })
                .type(InputType.Password)
                .fontSize(12)
                .fontColor('#F8FAFC')
                .backgroundColor('#0F172A')
                .borderRadius(8)
                .height(38)
                .onChange((value: string) => {
                  this.providerApiKey = value;
                })

              Text('Local Ollama works without a key — point the base URL at http://localhost:11434/v1')
                .fontSize(10)
                .fontColor('#64748B')
                .width('100%')

              Row({ space: 8 }) {
                Blank()
                Button('Save & regenerate')
                  .fontSize(12)
                  .fontColor('#FFFFFF')
                  .backgroundColor('#2563EB')
                  .height(32)
                  .borderRadius(8)
                  .onClick(() => {
                    this.showProviderPanel = false;
                    this.executeGeneration();
                    promptAction.showToast({
                      message: CloudEngine.hasCredentials(this.currentProvider())
                        ? 'Cloud provider updated'
                        : 'Saved — add an API key to enable cloud replies',
                      duration: 2500
                    });
                  })
              }
              .width('100%')
            }
            .width('100%')
            .padding(14)
            .backgroundColor('#1E293B')
            .borderRadius(14)
            .border({ width: 1, color: '#334155' })
            .margin({ left: 16, right: 16 })
          }

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

          // Target Language Picker (translate mode only)
          if (this.currentMode === 'translate') {
            Scroll() {
              Row({ space: 8 }) {
                ForEach(SUPPORTED_LANGUAGES, (language: LanguageOption) => {
                  Button(language.name)
                    .fontSize(12)
                    .fontColor(this.targetLanguage === language.code ? '#FFFFFF' : '#94A3B8')
                    .backgroundColor(this.targetLanguage === language.code ? '#0EA5E9' : '#1E293B')
                    .height(30)
                    .borderRadius(8)
                    .onClick(() => {
                      this.setLanguage(language.code);
                    })
                })
              }
            }
            .scrollable(ScrollDirection.Horizontal)
            .scrollBar(BarState.Off)
            .width('100%')
            .padding({ left: 16, right: 16 })
          }

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
                  this.statusBanner = '';
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
