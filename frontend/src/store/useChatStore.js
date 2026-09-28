import { create } from "zustand";
import {
  getClientHeuristicReplies,
  getClientHeuristicEnhancements,
  getClientHeuristicTranslations,
  getClientHeuristicSummary
} from "../utils/heuristicEngine";
import { callClientCloudLLM, PROVIDER_PRESETS } from "../utils/universalCloudEngine";

const LOCAL_STORAGE_KEY = "smart_reply_provider_config";
const ENGINE_MODE_KEY = "smart_reply_engine_mode";

function loadSavedProvider() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return PROVIDER_PRESETS[0]; // Groq by default
}

function loadSavedEngineMode() {
  try {
    const raw = localStorage.getItem(ENGINE_MODE_KEY);
    if (raw) return raw;
  } catch {}
  return "hybrid-race"; // Default: Hybrid Race (Zero Latency)
}

export const useChatStore = create((set, get) => {
  let abortController = null;

  return {
    input: "",
    results: [],
    loading: false,
    style: "professional",
    mode: "reply", // 'reply' | 'enhance' | 'translate' | 'summarize'
    language: "Spanish",
    error: null,
    latencyMs: 0,
    source: "heuristic",
    model: null,
    engineMode: loadSavedEngineMode(),
    providerConfig: loadSavedProvider(),

    setInput: (val) => set({ input: val }),
    setStyle: (sty) => set({ style: sty }),
    setMode: (m) => set({ mode: m, results: [], error: null }),
    setLanguage: (lang) => set({ language: lang }),
    
    setEngineMode: (m) => {
      try { localStorage.setItem(ENGINE_MODE_KEY, m); } catch {}
      set({ engineMode: m });
    },

    setProviderConfig: (config) => {
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config)); } catch {}
      set({ providerConfig: config });
    },

    clear: () => set({ input: "", results: [], error: null, latencyMs: 0 }),

    getResults: async () => {
      const state = get();
      const cleanInput = state.input.trim();
      if (!cleanInput) return;

      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      set({ loading: true, error: null });
      const startTime = performance.now();

      // 1. Generate local heuristic immediately
      let localResults = [];
      switch (state.mode) {
        case "enhance":
          localResults = getClientHeuristicEnhancements(cleanInput, state.style);
          break;
        case "translate":
          localResults = getClientHeuristicTranslations(cleanInput, state.language, state.style);
          break;
        case "summarize":
          localResults = getClientHeuristicSummary(cleanInput);
          break;
        case "reply":
        default:
          localResults = getClientHeuristicReplies(cleanInput, state.style);
          break;
      }

      // If mode is offline-only, return local heuristic immediately
      if (state.engineMode === "offline-only") {
        const elapsed = Math.round(performance.now() - startTime);
        set({
          results: localResults,
          source: "heuristic",
          latencyMs: elapsed,
          model: "on-device-rules",
          loading: false
        });
        return;
      }

      // Check if cloud credentials/endpoint available
      const hasKey = Boolean(state.providerConfig?.apiKey?.trim());
      const isLocalServer = state.providerConfig?.baseURL?.includes("localhost") || state.providerConfig?.baseURL?.includes("127.0.0.1");

      if (!hasKey && !isLocalServer) {
        // No API key provided: deliver instantaneous heuristic
        const elapsed = Math.round(performance.now() - startTime);
        set({
          results: localResults,
          source: "heuristic",
          latencyMs: elapsed,
          model: "on-device-rules",
          loading: false
        });
        return;
      }

      // Prepare Prompt for Cloud LLM
      let prompt = "";
      switch (state.mode) {
        case "enhance":
          prompt = `Text to enhance: "${cleanInput}"\nRewrite and polish in "${state.style}" tone. Return exactly 4 distinct variations as a JSON array of strings: ["v1", "v2", "v3", "v4"].`;
          break;
        case "translate":
          prompt = `Text to translate into ${state.language} (${state.style} tone): "${cleanInput}"\nProvide 4 distinct variations as a JSON array of strings: ["t1", "t2", "t3", "t4"].`;
          break;
        case "summarize":
          prompt = `Text to summarize: "${cleanInput}"\nProvide 4 distinct perspectives: executive summary, takeaway, bullet items, and quick recap as a JSON array of strings: ["s1", "s2", "s3", "s4"].`;
          break;
        case "reply":
        default:
          prompt = `Context message: "${cleanInput}"\nGenerate 4 distinct short replies in "${state.style}" tone. Output strictly a JSON array of strings: ["r1", "r2", "r3", "r4"].`;
          break;
      }

      try {
        // In hybrid-race mode, set a 1500ms race timeout
        const timeoutMs = state.engineMode === "hybrid-race" ? 1800 : 10000;
        const cloudPromise = callClientCloudLLM({
          providerConfig: state.providerConfig,
          prompt,
          signal: abortController.signal
        });

        const timerPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("RaceTimeout")), timeoutMs)
        );

        let outcome;
        if (state.engineMode === "cloud-only") {
          outcome = await cloudPromise;
        } else {
          // Race or Fallback
          try {
            outcome = await Promise.race([cloudPromise, timerPromise]);
          } catch (raceErr) {
            if (raceErr.message === "RaceTimeout") {
              // Graceful race resolution: return instant local results
              outcome = {
                results: localResults,
                source: "heuristic",
                latencyMs: Math.round(performance.now() - startTime),
                model: "hybrid-local-race"
              };
            } else {
              throw raceErr;
            }
          }
        }

        if (outcome.results?.length > 0) {
          set({
            results: outcome.results,
            source: outcome.source,
            latencyMs: outcome.latencyMs,
            model: outcome.model,
            error: null
          });
        } else {
          set({
            results: localResults,
            source: "heuristic",
            latencyMs: Math.round(performance.now() - startTime),
            model: "fallback-rules"
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Fallback to local heuristic on any network error
          set({
            results: localResults,
            source: "heuristic",
            latencyMs: Math.round(performance.now() - startTime),
            model: "fallback-on-error"
          });
        }
      } finally {
        set({ loading: false });
      }
    },

    cancelRequest: () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
        set({ loading: false });
      }
    }
  };
});