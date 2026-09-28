/**
 * Background Service Worker for Smart Reply AI Chrome Extension
 * Manifest V3 with Multi-Engine Strategy:
 * - Universal OpenAI-Compatible Cloud LLM (Groq, OpenRouter, Ollama, OpenAI)
 * - Zero-Latency On-Device Heuristic Fallback (<2ms)
 * - Optional Backend API Connection
 */

try {
  chrome.alarms.create("keepAlive", { periodInMinutes: 0.5 });
} catch (e) {
  console.error("Failed to create keep-alive alarm:", e);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Keep-alive tick
  }
});

// Register message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getResults") {
    fetchResults(request.input, request.style, request.mode, request.to_lang)
      .then((data) => {
        sendResponse(data);
      })
      .catch((err) => {
        // Even on unexpected error, deliver heuristic fallback
        const fallback = getExtensionHeuristic(request.input, request.mode, request.style, request.to_lang);
        sendResponse({ results: fallback, source: "heuristic", latencyMs: 1 });
      });
    return true; // Keep channel open for async response
  }
});

/**
 * Universal Multi-Engine Fetcher
 */
async function fetchResults(input, style = "professional", mode = "reply", to_lang = "spanish") {
  const startTime = Date.now();
  const cleanInput = (input || "").trim();
  if (!cleanInput) return { results: [], source: "none", latencyMs: 0 };

  // Load extension settings from storage
  const cfg = await new Promise((res) => {
    try {
      chrome.storage.sync.get(
        {
          engineMode: "hybrid", // 'hybrid' | 'offline' | 'cloud'
          provider: "groq", // 'groq' | 'openrouter' | 'ollama' | 'backend'
          apiKey: "",
          baseURL: "https://api.groq.com/openai/v1",
          model: "llama-3.1-8b-instant",
          backendUrl: "http://localhost:5006/api"
        },
        res
      );
    } catch (e) {
      res({
        engineMode: "hybrid",
        provider: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        model: "llama-3.1-8b-instant",
        backendUrl: "http://localhost:5006/api"
      });
    }
  });

  // 1. If user prefers offline-only, serve heuristic instantly
  if (cfg.engineMode === "offline") {
    const results = getExtensionHeuristic(cleanInput, mode, style, to_lang);
    return { results, source: "heuristic", latencyMs: Date.now() - startTime };
  }

  // 2. Try Direct Cloud LLM if API Key is set or local Ollama is target
  const isLocalServer = cfg.baseURL?.includes("localhost") || cfg.baseURL?.includes("127.0.0.1");
  if (cfg.apiKey?.trim() || isLocalServer) {
    try {
      const endpoint = cfg.baseURL.endsWith("/") ? `${cfg.baseURL}chat/completions` : `${cfg.baseURL}/chat/completions`;
      const prompt = buildPrompt(cleanInput, mode, style, to_lang);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const headers = { "Content-Type": "application/json" };
      if (cfg.apiKey?.trim()) {
        headers["Authorization"] = `Bearer ${cfg.apiKey.trim()}`;
      }
      if (cfg.baseURL.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://github.com/mahmud-r-farhan/smart-reply";
        headers["X-Title"] = "Smart Reply Extension";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: cfg.model || "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are an AI writing assistant. Output strictly a JSON array of 4 strings." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 350
        })
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || "";
        const list = parseLlmList(rawContent);
        if (list.length > 0) {
          return {
            results: list.slice(0, 4),
            source: "cloud-llm",
            latencyMs: Date.now() - startTime,
            model: cfg.model
          };
        }
      }
    } catch (e) {
      console.warn("Direct cloud fetch failed, attempting backend or heuristic fallback:", e.message);
    }
  }

  // 3. Try Backend API if configured
  if (cfg.backendUrl) {
    try {
      let endpoint = "/suggest-reply";
      let body = { message: cleanInput, format: style };
      if (mode === "enhance") {
        endpoint = "/enhance-text";
        body = { text: cleanInput, format: style };
      } else if (mode === "translate") {
        endpoint = "/translate-text";
        body = { text: cleanInput, format: style, language: to_lang };
      } else if (mode === "summarize") {
        endpoint = "/summarize-text";
        body = { text: cleanInput, format: style };
      }

      const url = `${cfg.backendUrl}${endpoint}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body)
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const list = data.suggestions || data.enhancements || data.translations || data.summaries || [];
        if (list.length > 0) {
          return {
            results: list.slice(0, 4),
            source: "backend-api",
            latencyMs: Date.now() - startTime
          };
        }
      }
    } catch (e) {
      console.warn("Backend fetch failed, using zero-latency heuristic:", e.message);
    }
  }

  // 4. Guaranteed Zero-Latency Heuristic Fallback
  const fallback = getExtensionHeuristic(cleanInput, mode, style, to_lang);
  return {
    results: fallback,
    source: "heuristic",
    latencyMs: Date.now() - startTime
  };
}

function buildPrompt(input, mode, style, to_lang) {
  if (mode === "enhance") {
    return `Text to enhance: "${input}"\nRewrite and improve in "${style}" tone. Return strictly a JSON array of 4 strings: ["v1", "v2", "v3", "v4"].`;
  }
  if (mode === "translate") {
    return `Translate into ${to_lang} in "${style}" tone: "${input}"\nReturn strictly a JSON array of 4 strings: ["t1", "t2", "t3", "t4"].`;
  }
  if (mode === "summarize") {
    return `Summarize: "${input}"\nProvide 4 perspectives (summary, key takeaway, bullet list, recap) strictly as a JSON array of 4 strings: ["s1", "s2", "s3", "s4"].`;
  }
  return `Context message: "${input}"\nGenerate 4 smart replies in "${style}" tone. Output strictly a JSON array of 4 strings: ["r1", "r2", "r3", "r4"].`;
}

function parseLlmList(content) {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.replies) return parsed.replies;
    if (parsed.suggestions) return parsed.suggestions;
  } catch {}

  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return content
    .split("\n")
    .map((l) => l.replace(/^\s*([*\-•\d\.\)]+)\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 0 && !l.startsWith("```"));
}

/**
 * Built-in Extension Heuristics Engine
 */
function getExtensionHeuristic(input, mode, style, to_lang) {
  const normStyle = (style || "professional").toLowerCase();
  const clean = (input || "").trim();

  if (mode === "enhance") {
    let polished = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!/[.?!]$/.test(polished)) polished += ".";
    return [
      polished,
      normStyle === "friendly" ? `${polished} Hope you have a great day! 😊` : `Please note: ${polished}`,
      normStyle === "casual" ? `${polished.replace(/[.]*$/, "")} — let me know!` : `In accordance with our discussion: ${polished}`,
      `Update: ${polished}`
    ];
  }

  if (mode === "translate") {
    return [
      `[${to_lang.toUpperCase()}] ${clean}`,
      `[${to_lang.toUpperCase()} - Formal]: ${clean}`,
      `[${to_lang.toUpperCase()} - Conversational]: ${clean}`,
      `[${to_lang.toUpperCase()} - Direct]: ${clean}`
    ];
  }

  if (mode === "summarize") {
    const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 5);
    const first = sentences[0] || clean;
    return [
      first,
      `Key Takeaway: ${first}`,
      sentences.slice(0, 3).map((s) => `• ${s}`).join("\n") || `• ${clean}`,
      `Summary: ${first}`
    ];
  }

  // Default: Smart Reply
  const lower = clean.toLowerCase();
  if (lower.includes("meet") || lower.includes("call") || lower.includes("schedule")) {
    return [
      "I would be glad to meet. Please send over an invite with the agenda.",
      "That works for me. What time window suits your schedule best?",
      "I'm available this week. Let me know which time slot works best.",
      "Let's sync up. Feel free to share your calendar link."
    ];
  }
  if (lower.includes("thank") || lower.includes("thanks")) {
    return [
      "You are very welcome! Please let me know if you need anything else.",
      "Glad I could be of assistance. Don't hesitate to reach out!",
      "Happy to help! Looking forward to our continued collaboration.",
      "It was my pleasure. Wishing you the best!"
    ];
  }

  return [
    "Thank you for the detailed update. I will review and follow up shortly.",
    "Acknowledged. That aligns well with our current roadmap.",
    "Thank you for sharing this. Let's touch base on the next steps.",
    "Understood. I will take the necessary action and keep you informed."
  ];
}

// Initialize context menu
function initializeContextMenu() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "smart-reply-selected",
        title: "Smart Reply / AI Assistant",
        contexts: ["selection"]
      });
    });
  } catch (e) {
    console.error("Context menu initialization error:", e);
  }
}
initializeContextMenu();

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "smart-reply-selected") {
    const selectedText = info.selectionText || "";
    if (selectedText) {
      chrome.storage.local
        .set({
          pendingAction: {
            mode: "reply",
            input: selectedText
          }
        })
        .then(() => chrome.action.openPopup())
        .catch(() => chrome.action.openPopup());
    }
  }
});