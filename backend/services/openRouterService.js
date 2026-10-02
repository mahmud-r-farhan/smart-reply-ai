import cacheManager from "../utils/cacheManager.js";
import singleflight from "../utils/singleflight.js";
import { getFormatInstruction, FORMATS, isValidFormat } from "../utils/modelSelector.js";
import { resolveProvider, isLocalEndpoint } from "../utils/providerResolver.js";
import { HttpError } from "../utils/validation.js";
import {
  getHeuristicReplies,
  getHeuristicEnhancements,
  getHeuristicTranslations,
  getHeuristicSummary
} from "./heuristicEngine.js";

const CLOUD_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 12000;
const LOCAL_TIMEOUT_MS = Number(process.env.LLM_LOCAL_TIMEOUT_MS) || 25000;
const CLOUD_RETRIES = Number.isFinite(Number(process.env.LLM_RETRIES))
  ? Math.min(Math.max(Number(process.env.LLM_RETRIES), 0), 3)
  : 1;

const heuristicResult = (results, startTime, model = "heuristic-rules-v1") => ({
  results,
  source: "heuristic",
  latencyMs: Date.now() - startTime,
  model,
});

/**
 * Parse an LLM answer into a clean list of suggestion strings.
 * Handles strict JSON, fenced/embedded JSON arrays and plain bullet lists.
 */
export const parseLlmList = (content) => {
  if (typeof content !== "string" || content.trim().length === 0) return [];

  let parsed = null;

  // 1. Direct JSON parse
  try {
    parsed = JSON.parse(content.trim());
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      parsed = parsed.replies ?? parsed.suggestions ?? parsed.variations ?? Object.values(parsed);
    }
  } catch {
    // 2. Extract the first bracketed JSON array
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  let list = Array.isArray(parsed) ? parsed : null;

  // 3. Fallback: bullet / numbered list parsing
  if (!list || list.length === 0) {
    list = content
      .replace(/```[a-z]*/gi, "")
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*(?:[*\-•]|\d+[.)])\s*/, "")
          .replace(/^["']|["',]+$/g, "")
          .trim()
      )
      .filter((line) => line.length > 0);
  }

  return list
    .map((item) => (typeof item === "string" ? item.replace(/^["']|["']$/g, "").trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 4);
};

/**
 * Universal OpenAI-Compatible Cloud Caller with Heuristic Fallback.
 * Executes against any OpenAI-standard endpoint (OpenRouter, Groq, Ollama, OpenAI).
 *
 * Never throws: when the cloud provider is unavailable or misconfigured it
 * degrades to the deterministic on-device heuristic engine.
 */
export const callUniversalLlm = async ({
  prompt,
  systemPrompt = "You are a helpful, precise AI writing and messaging assistant.",
  operationType = "SUGGESTIONS",
  providerConfig = null,
  fallbackGenerator = null,
  retries = CLOUD_RETRIES,
  refresh = false,
}) => {
  const startTime = Date.now();
  const fallbackResults = () => {
    const generated = fallbackGenerator ? fallbackGenerator() : [];
    return heuristicResult(generated, startTime);
  };

  let provider;
  try {
    provider = resolveProvider(providerConfig, operationType);
  } catch (error) {
    if (error instanceof HttpError) {
      // Invalid/hostile provider configuration is a client error, not a
      // transient failure: surface it instead of masking it with heuristics.
      throw error;
    }
    console.warn(`[UniversalLlm] Rejected provider config: ${error.message}`);
    return heuristicResult([], startTime, "provider-config-rejected");
  }

  const { baseURL, apiKey, model, temperature, maxTokens } = provider;
  const isLocalServer = isLocalEndpoint(baseURL);

  // No credentials and not a local LLM server: serve the heuristic engine instantly.
  if (!apiKey && !isLocalServer) {
    return heuristicResult([], startTime);
  }

  // SHA-256 cache lookup (prompt + endpoint + model + deterministic knobs)
  const cacheKey = cacheManager.generateKey(
    prompt,
    `${baseURL}:${model}:${temperature}:${maxTokens}`
  );
  // `refresh: true` (the UI "Regenerate" action) skips the cache READ so the
  // provider actually produces a fresh answer, while still warming the cache.
  const cached = refresh ? null : await cacheManager.getAsync(cacheKey);
  if (cached) {
    return {
      results: cached,
      source: "cache",
      latencyMs: Date.now() - startTime,
      model,
    };
  }

  // Collapse concurrent identical requests into a single upstream call.
  const flightKey = `${baseURL}::${model}::${operationType}::${cacheKey}`;
  return singleflight.do(flightKey, async () => {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      let timeout = null;
      try {
        const controller = new AbortController();
        timeout = setTimeout(
          () => controller.abort(),
          isLocalServer ? LOCAL_TIMEOUT_MS : CLOUD_TIMEOUT_MS
        );

        const endpoint = `${baseURL}/chat/completions`;
        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        if (baseURL.includes("openrouter.ai")) {
          headers["HTTP-Referer"] = "https://github.com/mahmud-r-farhan/smart-reply-ai";
          headers["X-Title"] = "Smart Reply AI Assistant";
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          let errBody = "";
          try {
            errBody = (await response.text()).slice(0, 500);
          } catch {
            /* ignore body read failures */
          }
          console.error(`[UniversalLlm] API error ${response.status} from ${endpoint}: ${errBody}`);

          // Auth / configuration errors are not retryable.
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            throw new Error(`Cloud LLM auth/config error (${response.status})`);
          }
          // 4xx validation errors will not succeed on retry either.
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`Cloud LLM rejected the request (${response.status})`);
          }
          throw new Error(`Cloud LLM responded with status ${response.status}`);
        }

        const data = await response.json();
        const content = (data.choices?.[0]?.message?.content || "").trim();
        const cleanList = parseLlmList(content);

        if (cleanList.length > 0) {
          await cacheManager.setAsync(cacheKey, cleanList);
          return {
            results: cleanList,
            source: "cloud-llm",
            latencyMs: Date.now() - startTime,
            model,
          };
        }

        throw new Error("Cloud LLM returned an empty or unparseable answer");
      } catch (err) {
        lastError = err;
        console.warn(`[UniversalLlm] Attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt < retries) {
          const backoff = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }

    // Graceful degradation: deterministic heuristic engine.
    console.warn(
      `[UniversalLlm] Cloud call failed (${lastError?.message}). Serving heuristic fallback.`
    );
    return fallbackResults();
  });
};

/**
 * Suggestions Generator (Smart Reply)
 * @returns {Promise<{results: string[], source: string, latencyMs: number, model: string}>}
 */
export const generateSuggestions = async (message, format = FORMATS.PROFESSIONAL, providerConfig = null, options = {}) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Context message received: "${message}"

Task: Generate exactly 4 distinct, high-quality, contextual short reply suggestions ${formatInstruction}.
Output strictly a valid JSON array of 4 strings, with no markdown code blocks and no surrounding commentary.
Example: ["Reply 1", "Reply 2", "Reply 3", "Reply 4"]`;

  const response = await callUniversalLlm({
    prompt,
    systemPrompt:
      "You are an expert conversation assistant crafting rapid smart replies. Return strictly a JSON array of strings.",
    operationType: "SUGGESTIONS",
    providerConfig,
    refresh: options.refresh === true,
    fallbackGenerator: () => getHeuristicReplies(message, format),
  });

  return response.results.length > 0
    ? response
    : { ...response, results: getHeuristicReplies(message, format), source: "heuristic" };
};

/**
 * Enhancements Generator (Smart Enhance / Proofreading)
 */
export const generateEnhancements = async (text, format = FORMATS.PROFESSIONAL, providerConfig = null, options = {}) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Text to enhance: "${text}"

Task: Rewrite and improve the text above ${formatInstruction}.
Improve grammar, clarity, vocabulary, tone, and conciseness.
Output strictly a valid JSON array of 4 high-quality variations, with no markdown code blocks and no surrounding commentary.
Example: ["Variation 1", "Variation 2", "Variation 3", "Variation 4"]`;

  const response = await callUniversalLlm({
    prompt,
    systemPrompt:
      "You are a professional editor and copywriter. Enhance the input text and return strictly a JSON array of strings.",
    operationType: "ENHANCEMENTS",
    providerConfig,
    refresh: options.refresh === true,
    fallbackGenerator: () => getHeuristicEnhancements(text, format),
  });

  return response.results.length > 0
    ? response
    : { ...response, results: getHeuristicEnhancements(text, format), source: "heuristic" };
};

/**
 * Translations Generator (Smart Translate)
 */
export const generateTranslations = async (text, language = "english", format = FORMATS.PROFESSIONAL, providerConfig = null, options = {}) => {
  const formatInstruction = getFormatInstruction(format);
  const prompt = `Text to translate: "${text}"
Target language: ${language}

Task: Translate the text accurately into ${language} ${formatInstruction}.
Provide 4 distinct variations (e.g. natural conversational, polite/formal, concise, expressive).
Output strictly a valid JSON array of 4 translated strings, with no markdown code blocks and no surrounding commentary.
Example: ["Translation 1", "Translation 2", "Translation 3", "Translation 4"]`;

  const response = await callUniversalLlm({
    prompt,
    systemPrompt: `You are a native translator in ${language}. Provide natural, idiomatically accurate translations. Return strictly a JSON array of strings.`,
    operationType: "TRANSLATIONS",
    providerConfig,
    refresh: options.refresh === true,
    fallbackGenerator: () => getHeuristicTranslations(text, language, format),
  });

  return response.results.length > 0
    ? response
    : { ...response, results: getHeuristicTranslations(text, language, format), source: "heuristic" };
};

/**
 * Summarization Generator (Smart Summarize - ML Kit GenAI spec)
 */
export const generateSummaries = async (text, format = FORMATS.CONCISE, providerConfig = null, options = {}) => {
  const prompt = `Text to summarize:
"${text}"

Task: Generate 4 concise, high-value summary perspectives:
1. One-sentence executive summary
2. Key takeaway and conclusion
3. Action items / bullet summary
4. Brief conversational recap
Output strictly a valid JSON array of 4 strings, with no markdown code blocks.`;

  const response = await callUniversalLlm({
    prompt,
    systemPrompt:
      "You are an executive summarization assistant. Synthesize long messages and articles into crisp summaries. Return strictly a JSON array of strings.",
    operationType: "SUMMARIZATION",
    providerConfig,
    refresh: options.refresh === true,
    fallbackGenerator: () => getHeuristicSummary(text),
  });

  return response.results.length > 0
    ? response
    : { ...response, results: getHeuristicSummary(text), source: "heuristic" };
};

export { FORMATS, isValidFormat };
