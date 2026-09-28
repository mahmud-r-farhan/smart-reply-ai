/**
 * SmartReplyTypes.ets
 * Native HarmonyOS ArkTS Model Definitions for Smart Reply AI
 */

export type AppMode = 'reply' | 'enhance' | 'translate' | 'summarize';

export type ToneStyle = 'professional' | 'friendly' | 'casual' | 'concise' | 'formal' | 'flirty' | 'romantic';

export type EngineMode = 'hybrid' | 'offline' | 'cloud';

export interface ReplySuggestion {
  id: string;
  text: string;
  tone: string;
  source: 'heuristic' | 'cloud';
  latencyMs: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', name: 'English', nativeName: 'English' },
];
