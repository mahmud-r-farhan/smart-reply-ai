/**
 * HeuristicEngine.ets
 * Native HarmonyOS ArkTS Zero-Latency On-Device Rules Engine (< 1ms)
 */

import { ReplySuggestion } from '../models/SmartReplyTypes';

export class HeuristicEngine {

  /**
   * Generates instant context-aware smart replies on-device
   */
  public static generateReplies(input: string, tone: string = 'friendly'): ReplySuggestion[] {
    const start = Date.now();
    const clean = input.toLowerCase().trim();
    const results: string[] = [];

    // Greeting patterns
    if (/(hi|hello|hey|good morning|good evening|good afternoon|howdy)/i.test(clean)) {
      if (tone === 'professional' || tone === 'formal') {
        results.push('Good day. How may I assist you today?');
        results.push('Hello, thank you for reaching out.');
        results.push('Greetings. I hope this message finds you well.');
      } else if (tone === 'casual') {
        results.push('Hey there! What\'s up?');
        results.push('Yo! Hope you\'re having a good one.');
        results.push('Hey! Great to hear from you.');
      } else {
        results.push('Hello! Great to hear from you.');
        results.push('Hi! How are things going?');
        results.push('Hey! Hope you are doing well.');
      }
    }
    // Meeting & Scheduling patterns
    else if (/(meet|meeting|calendar|zoom|teams|schedule|sync|coffee|call|tomorrow|today)/i.test(clean)) {
      if (tone === 'professional' || tone === 'formal') {
        results.push('I would be glad to meet. Please send an invite.');
        results.push('That time works well for me. I have confirmed on my calendar.');
        results.push('I have a conflict at that hour. Could we reschedule to later in the afternoon?');
      } else if (tone === 'concise') {
        results.push('Confirmed. See you then.');
        results.push('Works for me. Sending invite.');
        results.push('Need to reschedule.');
      } else {
        results.push('Sounds great! Looking forward to catching up.');
        results.push('That time works perfectly for me! See you then.');
        results.push('Let me double-check my schedule and get back to you shortly.');
      }
    }
    // Gratitude / Appreciation
    else if (/(thanks|thank you|appreciate|grateful|kudos)/i.test(clean)) {
      if (tone === 'professional' || tone === 'formal') {
        results.push('You are most welcome. It was my pleasure to assist.');
        results.push('Glad I could help. Please let me know if you need anything else.');
      } else {
        results.push('Anytime! Glad to help out.');
        results.push('You\'re very welcome! 😊');
        results.push('No problem at all!');
      }
    }
    // Agreement / Confirmation
    else if (/(okay|ok|sounds good|deal|agree|done|approved|ready)/i.test(clean)) {
      results.push('Sounds like a plan!');
      results.push('Perfect, let\'s move forward with this.');
      results.push('Understood, thank you for confirming.');
    }
    // Question / Inquiries
    else if (clean.includes('?')) {
      if (tone === 'professional') {
        results.push('Thank you for inquiring. I am currently reviewing the details.');
        results.push('I will investigate this and provide a comprehensive update shortly.');
        results.push('Could you please provide additional context on this matter?');
      } else {
        results.push('Good question! Let me look into that for you.');
        results.push('Sure thing, give me a few moments to check.');
        results.push('I\'ll verify and get right back to you!');
      }
    }
    // Default fallback
    else {
      results.push('Got it, thank you for sharing!');
      results.push('Thanks for the update. I\'ll review this shortly.');
      results.push('Understood. Let me follow up on this soon.');
    }

    const elapsed = Date.now() - start;
    return results.map((text, idx): ReplySuggestion => ({
      id: `heur_${idx}_${Date.now()}`,
      text: text,
      tone: tone,
      source: 'heuristic',
      latencyMs: elapsed < 1 ? 1 : elapsed
    }));
  }

  /**
   * Enhances text grammar, clarity, and tone locally
   */
  public static enhanceText(input: string, tone: string = 'friendly'): ReplySuggestion[] {
    const start = Date.now();
    let trimmed = input.trim();
    if (trimmed.length > 0) {
      trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      if (!/[.!?]$/.test(trimmed)) {
        trimmed += '.';
      }
    }

    const enhancedOptions: string[] = [];

    if (tone === 'professional') {
      enhancedOptions.push(`I would appreciate your attention to: ${trimmed}`);
      enhancedOptions.push(`Regarding the following matter: ${trimmed} Please let me know your thoughts.`);
      enhancedOptions.push(`${trimmed} Thank you for your continued collaboration.`);
    } else if (tone === 'concise') {
      enhancedOptions.push(trimmed);
      enhancedOptions.push(`Update: ${trimmed}`);
    } else {
      enhancedOptions.push(`Hey! Just wanted to share: ${trimmed}`);
      enhancedOptions.push(`${trimmed} Hope this helps! 😊`);
      enhancedOptions.push(`Quick note: ${trimmed}`);
    }

    const elapsed = Date.now() - start;
    return enhancedOptions.map((text, idx): ReplySuggestion => ({
      id: `enh_${idx}_${Date.now()}`,
      text: text,
      tone: tone,
      source: 'heuristic',
      latencyMs: elapsed < 1 ? 1 : elapsed
    }));
  }

  /**
   * Instant offline phrasebook translation
   */
  public static translateText(input: string, targetLang: string, tone: string = 'friendly'): ReplySuggestion[] {
    const start = Date.now();
    const clean = input.toLowerCase().trim();

    const dictionary: Record<string, Record<string, string>> = {
      'hello': { es: 'Hola', fr: 'Bonjour', de: 'Hallo', zh: '你好', ja: 'こんにちは', ar: 'مرحبا', bn: 'হ্যালো', pt: 'Olá', it: 'Ciao', hi: 'नमस्ते' },
      'thank you': { es: 'Gracias', fr: 'Merci', de: 'Danke', zh: '谢谢', ja: 'ありがとう', ar: 'شكراً', bn: 'ধন্যবাদ', pt: 'Obrigado', it: 'Grazie', hi: 'धन्यवाद' },
      'goodbye': { es: 'Adiós', fr: 'Au revoir', de: 'Auf Wiedersehen', zh: '再见', ja: 'さようなら', ar: 'مع السلامة', bn: 'বিদায়', pt: 'Adeus', it: 'Arrivederci', hi: 'अलविदा' },
      'yes': { es: 'Sí', fr: 'Oui', de: 'Ja', zh: '是的', ja: 'はい', ar: 'نعم', bn: 'হ্যাঁ', pt: 'Sim', it: 'Sì', hi: 'हाँ' },
      'no': { es: 'No', fr: 'Non', de: 'Nein', zh: '不', ja: 'いいえ', ar: 'لا', bn: 'না', pt: 'Não', it: 'No', hi: 'नहीं' }
    };

    let translated = '';
    for (const phrase of Object.keys(dictionary)) {
      if (clean.includes(phrase)) {
        translated = dictionary[phrase][targetLang] || '';
        break;
      }
    }

    if (!translated) {
      translated = `[${targetLang.toUpperCase()}]: ${input}`;
    }

    const elapsed = Date.now() - start;
    return [{
      id: `trans_${Date.now()}`,
      text: translated,
      tone: tone,
      source: 'heuristic',
      latencyMs: elapsed < 1 ? 1 : elapsed
    }];
  }

  /**
   * Extractive key-takeaway bullet summarization
   */
  public static summarizeText(input: string): ReplySuggestion[] {
    const start = Date.now();
    const sentences = input
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    const bullets: string[] = [];
    if (sentences.length <= 2) {
      bullets.push(`• Key takeaway: ${input.trim()}`);
    } else {
      bullets.push(`• Primary objective: ${sentences[0]}.`);
      bullets.push(`• Action item: ${sentences[Math.floor(sentences.length / 2)]}.`);
      bullets.push(`• Summary conclusion: ${sentences[sentences.length - 1]}.`);
    }

    const elapsed = Date.now() - start;
    return [{
      id: `sum_${Date.now()}`,
      text: bullets.join('\n'),
      tone: 'concise',
      source: 'heuristic',
      latencyMs: elapsed < 1 ? 1 : elapsed
    }];
  }
}
