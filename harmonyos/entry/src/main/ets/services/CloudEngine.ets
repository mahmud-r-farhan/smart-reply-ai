/**
 * CloudEngine.ets
 * Native HarmonyOS Universal OpenAI-Compatible Cloud LLM Client using @ohos.net.http
 */

import http from '@ohos.net.http';
import { ProviderConfig, ReplySuggestion } from '../models/SmartReplyTypes';

export class CloudEngine {
  private static defaultProvider: ProviderConfig = {
    id: 'groq',
    name: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    apiKey: ''
  };

  /**
   * Dispatches chat completions query to cloud LLM using HarmonyOS Network Kit
   */
  public static async queryCloud(
    prompt: string,
    systemInstruction: string,
    provider: ProviderConfig = CloudEngine.defaultProvider
  ): Promise<ReplySuggestion[]> {
    const startTime = Date.now();
    const httpRequest = http.createHttp();

    try {
      const url = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const payload = {
        model: provider.model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (provider.apiKey && provider.apiKey.trim().length > 0) {
        headers['Authorization'] = `Bearer ${provider.apiKey.trim()}`;
      }

      const response = await httpRequest.request(url, {
        method: http.RequestMethod.POST,
        header: headers,
        extraData: JSON.stringify(payload),
        readTimeout: 10000,
        connectTimeout: 8000
      });

      const elapsed = Date.now() - startTime;

      if (response.responseCode === 200 && response.result) {
        const rawJson = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
        const parsed = JSON.parse(rawJson);
        const content = parsed.choices?.[0]?.message?.content || '';

        // Try extracting numbered suggestions or lines
        const lines = content
          .split('\n')
          .map((line: string) => line.replace(/^[\d\-•\*\.\s]+/, '').trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 4);

        if (lines.length > 0) {
          return lines.map((text: string, idx: number): ReplySuggestion => ({
            id: `cloud_${idx}_${Date.now()}`,
            text: text,
            tone: 'cloud',
            source: 'cloud',
            latencyMs: elapsed
          }));
        }

        return [{
          id: `cloud_single_${Date.now()}`,
          text: content.trim(),
          tone: 'cloud',
          source: 'cloud',
          latencyMs: elapsed
        }];
      } else {
        throw new Error(`Cloud API responded with HTTP status ${response.responseCode}`);
      }
    } finally {
      httpRequest.destroy();
    }
  }
}
