import cacheManager from "../utils/cacheManager.js";
import { 
  getDefaultModel, 
  getFormatInstruction, 
  isValidFormat, 
  FORMATS,
  PROVIDER_PRESETS 
} from "../utils/modelSelector.js";
import {
  getHeuristicReplies,
  getHeuristicEnhancements,
  getHeuristicTranslations,
  getHeuristicSummary
} from "./heuristicEngine.js";

/**
 * Universal OpenAI-Compatible Cloud Caller with Heuristic Fallback
 * Executes against any OpenAI-standard endpoint (OpenRouter, Groq, Ollama, OpenAI, DeepSeek)
 */
export const callUniversalLlm = async ({
  prompt,
  systemPrompt = "You are a helpful, precise AI writing and messaging assistant.",
  operationType = "SUGGESTIONS",
  providerConfig = null,
  format = "professional",
  fallbackGenerator = null,
  retries = 1
}) => {
  const startTime = Date.now();

  // Resolve Provider Config
  const resolvedBaseURL = providerConfig?.baseURL || process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
  const resolvedApiKey = providerConfig?.apiKey || process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY;
  const resolvedModel = providerConfig?.model || getDefaultModel(operationType);

  // If no API key is provided and endpoint is not a local server (like Ollama),
  // gracefully fall back to zero-latency heuristic engine
  const isLocalServer = resolvedBaseURL.includes("localhost") || resolvedBaseURL.includes("127.0.0.1");
  if (!resolvedApiKey && !isLocalServer) {
    console.warn(`[UniversalLlm] No API key configured. Executing zero-latency on-device heuristic fallback.`);
    const fallbackResults = fallbackGenerator ? fallbackGenerator() : [];
    return {
      results: fallbackResults,
      source: "heuristic",
      latencyMs: Date.now() - startTime,
      model: "heuristic-rules-v1"
    };
  }

  // Check SHA-256 Cache first
  const cacheKey = cacheManager.generateKey(prompt, `${resolvedBaseURL}:${resolvedModel}`);
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    return {
      results: cached,
      source: "cache",
      latencyMs: Date.now() - startTime,
      model: resolvedModel
    };
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutMs = isLocalServer ? 25000 : 12000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = resolvedBaseURL.endsWith("/") 
        ? `${resolvedBaseURL}chat/completions` 
        : `${resolvedBaseURL}/chat/completions`;

      const headers = {
        "Content-Type": "application/json",
      };

      if (resolvedApiKey) {
        headers["Authorization"] = `Bearer ${resolvedApiKey}`;
      }

      // Add OpenRouter specific headers if targeting OpenRouter
      if (resolvedBaseURL.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://github.com/mahmud-r-farhan/smart-reply";
        headers["X-Title"] = "Smart Reply AI Assistant";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: resolvedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: providerConfig?.temperature ?? 0.7,
          max_tokens: providerConfig?.maxTokens ?? 350
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errBody = "";
        try { errBody = await response.text(); } catch {}
        console.error(`[UniversalLlm] API error ${response.status} from ${endpoint}:`, errBody);

        // Don't retry on client authentication or validation error
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          throw new Error(`Cloud LLM Auth/Config error: ${response.statusText}`);
        }

        // Retry on 5xx or rate limit
        if ((response.status >= 500 || response.status === 429) && attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        throw new Error(`Cloud LLM responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = (data.choices?.[0]?.message?.content || "").trim();

      let parsedResults = [];

      // 1. Try direct JSON parse
      try {
        parsedResults = JSON.parse(content);
        if (!Array.isArray(parsedResults)) {
          if (parsedResults.replies) parsedResults = parsedResults.replies;
          else if (parsedResults.suggestions) parsedResults = parsedResults.suggestions;
          else if (parsedResults.variations) parsedResults = parsedResults.variations;
          else parsedResults = Object.values(parsedResults);
        }
      } catch {
        // 2. Try regex extraction of JSON array
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            parsedResults = JSON.parse(match[0]);
          } catch {
            parsedResults = [];
          }
        }

        // 3. Fallback: Parse bullet / numbered lists
        if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
          parsedResults = content
            .split("\n")
            .map(line => line.replace(/^\s*([*\-•\d\.\)]+)\s*/, "").replace(/^["']|["']$/g, "").trim())
            .filter(line => line.length > 0 && !line.startsWith("```"));
        }
      }

      const cleanList = (Array.isArray(parsedResults) ? parsedResults : [content])
        .filter(item => typeof item === "string" && item.trim().length > 0)
        .slice(0, 4);

      if (cleanList.length > 0) {
        // Cache valid result
        cacheManager.set(cacheKey, cleanList);
        return {
          results: cleanList,
          source: "cloud-llm",
          latencyMs: Date.now() - startTime,
          model: resolvedModel
        };
      }

    } catch (err) {
      lastError = err;
      console.warn(`[UniversalLlm] Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  // Graceful degradation: Fall back to deterministic heuristic engine
  console.warn(`[UniversalLlm] Cloud call failed (${lastError?.message}). Serving heuristic fallback.`);
  const fallbackResults = fallbackGenerator ? fallbackGenerator() : [];
  return {
    results: fallbackResults,
    source: "heuristic",
    latencyMs: Date.now() - startTime,
    model: "heuristic-fallback"
  };
};

/**
 * Suggestions Generator (Smart Reply)
 */
export const generateSuggestions = async (message, format = FORMATS.PROFESSIONAL, providerConfig = null) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Context message received: "${message}"

Task: Generate exactly 4 distinct, high-quality, contextual short reply suggestions ${formatInstruction}.
Output strictly a valid JSON array of 4 strings, with no markdown code blocks and no surrounding commentary.
Example: ["Reply 1", "Reply 2", "Reply 3", "Reply 4"]`;

  const fallbackGen = () => getHeuristicReplies(message, format);

  const response = await callUniversalLlm({
    prompt,
    systemPrompt: "You are an expert conversation assistant crafting rapid smart replies. Return strictly a JSON array of strings.",
    operationType: "SUGGESTIONS",
    providerConfig,
    format,
    fallbackGenerator: fallbackGen
  });

  return response.results.length > 0 ? response.results : fallbackGen();
};

/**
 * Enhancements Generator (Smart Enhance / Proofreading)
 */
export const generateEnhancements = async (text, format = FORMATS.PROFESSIONAL, providerConfig = null) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Text to enhance: "${text}"

Task: Rewrite and improve the text above ${formatInstruction}.
Improve grammar, clarity, vocabulary, tone, and conciseness.
Output strictly a valid JSON array of 4 high-quality variations, with no markdown code blocks and no surrounding commentary.
Example: ["Variation 1", "Variation 2", "Variation 3", "Variation 4"]`;

  const fallbackGen = () => getHeuristicEnhancements(text, format);

  const response = await callUniversalLlm({
    prompt,
    systemPrompt: "You are a professional editor and copywriter. Enhance the input text and return strictly a JSON array of strings.",
    operationType: "ENHANCEMENTS",
    providerConfig,
    format,
    fallbackGenerator: fallbackGen
  });

  return response.results.length > 0 ? response.results : fallbackGen();
};

/**
 * Translations Generator (Smart Translate)
 */
export const generateTranslations = async (text, language = "english", format = FORMATS.PROFESSIONAL, providerConfig = null) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Text to translate: "${text}"
Target language: ${language}

Task: Translate the text accurately into ${language} ${formatInstruction}.
Provide 4 distinct variations (e.g. natural conversational, polite/formal, concise, expressive).
Output strictly a valid JSON array of 4 translated strings, with no markdown code blocks and no surrounding commentary.
Example: ["Translation 1", "Translation 2", "Translation 3", "Translation 4"]`;

  const fallbackGen = () => getHeuristicTranslations(text, language, format);

  const response = await callUniversalLlm({
    prompt,
    systemPrompt: `You are a native translator in ${language}. Provide natural, idiomatically accurate translations. Return strictly a JSON array of strings.`,
    operationType: "TRANSLATIONS",
    providerConfig,
    format,
    fallbackGenerator: fallbackGen
  });

  return response.results.length > 0 ? response.results : fallbackGen();
};

/**
 * Summarization Generator (Smart Summarize - ML Kit GenAI spec)
 */
export const generateSummaries = async (text, format = FORMATS.CONCISE, providerConfig = null) => {
  const prompt = `Text to summarize:
"${text}"

Task: Generate 4 concise, high-value summary perspectives:
1. One-sentence executive summary
2. Key takeaway and conclusion
3. Action items / bullet summary
4. Brief conversational recap
Output strictly a valid JSON array of 4 strings, with no markdown code blocks.`;

  const fallbackGen = () => getHeuristicSummary(text);

  const response = await callUniversalLlm({
    prompt,
    systemPrompt: "You are an executive summarization assistant. Synthesize long messages and articles into crisp summaries. Return strictly a JSON array of strings.",
    operationType: "SUMMARIZATION",
    providerConfig,
    format,
    fallbackGenerator: fallbackGen
  });

  return response.results.length > 0 ? response.results : fallbackGen();
};

export { FORMATS, isValidFormat };