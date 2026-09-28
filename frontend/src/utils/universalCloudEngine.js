/**
 * Universal OpenAI-Compatible Cloud Caller for Web Browser
 * Communicates with Groq, OpenRouter, Ollama, or OpenAI directly from client.
 */

export const PROVIDER_PRESETS = [
  {
    id: "groq",
    name: "Groq (Ultra-Fast LPU)",
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    placeholderKey: "gsk_...",
    isLocal: false
  },
  {
    id: "openrouter",
    name: "OpenRouter (Multi-Model)",
    baseURL: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    placeholderKey: "sk-or-v1-...",
    isLocal: false
  },
  {
    id: "ollama",
    name: "Ollama (Local / LAN Server)",
    baseURL: "http://localhost:11434/v1",
    model: "llama3.2:latest",
    placeholderKey: "No key needed",
    isLocal: true
  },
  {
    id: "openai",
    name: "OpenAI Direct",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    placeholderKey: "sk-proj-...",
    isLocal: false
  }
];

export async function callClientCloudLLM({
  providerConfig,
  prompt,
  systemPrompt = "You are a helpful AI assistant. Output strictly a JSON array of strings.",
  signal
}) {
  const startTime = performance.now();
  const baseURL = (providerConfig?.baseURL || "https://openrouter.ai/api/v1").trim();
  const endpoint = baseURL.endsWith("/") ? `${baseURL}chat/completions` : `${baseURL}/chat/completions`;

  const headers = {
    "Content-Type": "application/json"
  };

  if (providerConfig?.apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${providerConfig.apiKey.trim()}`;
  }

  if (baseURL.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = window.location.origin || "https://smart-reply-delta.vercel.app";
    headers["X-Title"] = "Smart Reply Web";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      model: providerConfig?.model || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: providerConfig?.temperature ?? 0.7,
      max_tokens: providerConfig?.maxTokens ?? 350
    })
  });

  const latencyMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Provider returned ${response.status}: ${errText.slice(0, 100)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";

  let list = [];

  // 1. JSON parse
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) list = parsed;
    else if (parsed.replies) list = parsed.replies;
    else if (parsed.suggestions) list = parsed.suggestions;
    else if (parsed.variations) list = parsed.variations;
    else list = Object.values(parsed);
  } catch {
    // 2. Regex bracket match
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        list = JSON.parse(match[0]);
      } catch {}
    }

    // 3. Fallback list parse
    if (!Array.isArray(list) || list.length === 0) {
      list = content
        .split("\n")
        .map(l => l.replace(/^\s*([*\-•\d\.\)]+)\s*/, "").replace(/^["']|["']$/g, "").trim())
        .filter(l => l.length > 0 && !l.startsWith("```"));
    }
  }

  return {
    results: (Array.isArray(list) ? list : [content]).slice(0, 4),
    source: "cloud-llm",
    latencyMs,
    model: providerConfig?.model
  };
}
