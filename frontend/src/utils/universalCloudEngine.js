/**
 * Universal OpenAI-Compatible Cloud Caller for the Web Client
 * (Groq, OpenRouter, Ollama, OpenAI) plus an optional backend API bridge.
 *
 * Design goals:
 *  - parse any reasonable LLM answer shape into a clean list of ≤4 strings
 *  - never leave a dangling timer / aborted request
 *  - surface provider errors with useful messages for the UI
 */

export const PROVIDER_PRESETS = [
  {
    id: "groq",
    name: "Groq (Ultra-Fast LPU)",
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    placeholderKey: "gsk_...",
    isLocal: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter (Multi-Model)",
    baseURL: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    placeholderKey: "sk-or-v1-...",
    isLocal: false,
  },
  {
    id: "ollama",
    name: "Ollama (Local / LAN Server)",
    baseURL: "http://localhost:11434/v1",
    model: "llama3.2:latest",
    placeholderKey: "No key needed",
    isLocal: true,
  },
  {
    id: "openai",
    name: "OpenAI Direct",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    placeholderKey: "sk-proj-...",
    isLocal: false,
  },
];

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"];

/** True for Ollama-style local servers (no API key required). */
export const isLocalEndpoint = (baseURL = "") => {
  try {
    const url = new URL(baseURL);
    return LOCAL_HOSTNAMES.includes(url.hostname.toLowerCase());
  } catch {
    return LOCAL_HOSTNAMES.some((host) => baseURL.includes(host));
  }
};

/** Parse an LLM answer into a clean list of suggestion strings. */
export const parseLlmList = (content) => {
  if (typeof content !== "string" || content.trim().length === 0) return [];

  let parsed = null;
  try {
    parsed = JSON.parse(content.trim());
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      parsed = parsed.replies ?? parsed.suggestions ?? parsed.variations ?? Object.values(parsed);
    }
  } catch {
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
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);
};

/**
 * Direct browser → provider call (BYOK).
 * @returns {Promise<{results: string[], source: string, latencyMs: number, model: string}>}
 */
export async function callClientCloudLLM({
  providerConfig,
  prompt,
  systemPrompt = "You are a helpful AI assistant. Output strictly a JSON array of strings.",
  signal,
  retries = 1,
}) {
  const startTime = performance.now();
  const baseURL = (providerConfig?.baseURL || "https://openrouter.ai/api/v1").trim().replace(/\/+$/, "");
  const endpoint = `${baseURL}/chat/completions`;
  const model = providerConfig?.model || "llama-3.1-8b-instant";

  const headers = { "Content-Type": "application/json" };
  if (providerConfig?.apiKey?.trim()) {
    headers.Authorization = `Bearer ${providerConfig.apiKey.trim()}`;
  }
  if (baseURL.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = window.location.origin || "https://github.com/mahmud-r-farhan/smart-reply-ai";
    headers["X-Title"] = "Smart Reply Web";
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: providerConfig?.temperature ?? 0.7,
          max_tokens: providerConfig?.maxTokens ?? 350,
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let detail = "";
        try {
          detail = (await response.text()).slice(0, 300);
        } catch {
          /* ignore body read failure */
        }
        const error = new Error(`Provider returned ${response.status}: ${detail}`);
        error.status = response.status;
        // Only 429/5xx are worth retrying.
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === retries) throw error;
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || "";
      const results = parseLlmList(content);

      if (results.length === 0) {
        throw new Error("Provider returned an empty or unparseable answer");
      }

      return { results, source: "cloud-llm", latencyMs, model };
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError ?? new Error("Cloud request failed");
}

/**
 * Optional backend bridge. The React app is fully usable without it (BYOK or
 * on-device heuristics), but when the backend is deployed — or proxied through
 * the dev server at `/api` — it provides server-side keys and shared caching.
 */
export async function callBackendApi({
  endpoint = "/api",
  mode = "reply",
  input,
  style = "professional",
  language = "english",
  providerConfig = null,
  refresh = false,
  signal,
}) {
  const base = (endpoint || "/api").trim().replace(/\/+$/, "");

  const routes = {
    reply: { path: "/suggest-reply", key: "suggestions", body: { message: input, format: style } },
    enhance: { path: "/enhance-text", key: "enhancements", body: { text: input, format: style } },
    translate: {
      path: "/translate-text",
      key: "translations",
      body: { text: input, language, format: style },
    },
    summarize: { path: "/summarize-text", key: "summaries", body: { text: input, format: style } },
  };

  const route = routes[mode] || routes.reply;
  const startTime = performance.now();

  const response = await fetch(`${base}${route.path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      ...route.body,
      ...(providerConfig?.apiKey ? { providerConfig } : {}),
      ...(refresh ? { refresh: true } : {}),
    }),
  });

  const latencyMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.json())?.error || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Backend returned ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data[route.key]) ? data[route.key] : [];

  if (results.length === 0) {
    throw new Error("Backend returned no results");
  }

  return {
    results,
    source: data.source || "backend-api",
    latencyMs: data.latencyMs ?? latencyMs,
    model: data.model || null,
  };
}
