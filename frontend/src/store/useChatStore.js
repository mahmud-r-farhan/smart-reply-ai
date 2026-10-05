import { create } from "zustand";
import {
  getClientHeuristicReplies,
  getClientHeuristicEnhancements,
  getClientHeuristicTranslations,
  getClientHeuristicSummary,
} from "../utils/heuristicEngine";
import {
  callClientCloudLLM,
  callBackendApi,
  isLocalEndpoint,
  PROVIDER_PRESETS,
} from "../utils/universalCloudEngine";

const LOCAL_STORAGE_KEY = "smart_reply_provider_config";
const ENGINE_MODE_KEY = "smart_reply_engine_mode";

// `/api` is proxied to the backend by the Vite dev server and by most static
// hosts (Netlify/Vercel rewrites). Override with VITE_API_ENDPOINT if needed.
const BACKEND_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "/api";

const HYBRID_TIMEOUT_MS = 2500;
const CLOUD_TIMEOUT_MS = 15000;

function loadSavedProvider() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.baseURL === "string") return parsed;
    }
  } catch {
    /* corrupted storage — fall back to defaults */
  }
  return PROVIDER_PRESETS[0];
}

function loadSavedEngineMode() {
  try {
    const raw = localStorage.getItem(ENGINE_MODE_KEY);
    if (raw && ["hybrid-race", "offline-only", "cloud-only"].includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "hybrid-race";
}

/** Reject after `ms`, clearing the timer no matter the outcome. */
function withTimeout(promise, ms, onTimeout) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error("RequestTimeout"));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function buildPrompt(mode, input, style, language, refresh = false) {
  const suffix = refresh
    ? "\nThe user pressed Regenerate: produce noticeably different wording from a previous answer."
    : "";
  switch (mode) {
    case "enhance":
      return `Text to enhance: "${input}"\nRewrite and polish in "${style}" tone. Return exactly 4 distinct variations as a JSON array of strings: ["v1", "v2", "v3", "v4"].${suffix}`;
    case "translate":
      return `Text to translate into ${language} (${style} tone): "${input}"\nProvide 4 distinct variations as a JSON array of strings: ["t1", "t2", "t3", "t4"].${suffix}`;
    case "summarize":
      return `Text to summarize: "${input}"\nProvide 4 distinct perspectives: executive summary, takeaway, bullet items, and quick recap as a JSON array of strings: ["s1", "s2", "s3", "s4"].${suffix}`;
    case "reply":
    default:
      return `Context message: "${input}"\nGenerate 4 distinct short replies in "${style}" tone. Output strictly a JSON array of strings: ["r1", "r2", "r3", "r4"].${suffix}`;
  }
}

function localHeuristics(mode, input, style, language) {
  switch (mode) {
    case "enhance":
      return getClientHeuristicEnhancements(input, style);
    case "translate":
      return getClientHeuristicTranslations(input, language, style);
    case "summarize":
      return getClientHeuristicSummary(input);
    case "reply":
    default:
      return getClientHeuristicReplies(input, style);
  }
}

export const useChatStore = create((set, get) => {
  // Module-scoped request bookkeeping: the request counter makes sure a stale
  // response can never overwrite the results of a newer request.
  let abortController = null;
  let requestCounter = 0;

  const isStale = (requestId) => requestId !== requestCounter;

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
    setLanguage: (lang) => set({ language: lang }),

    setMode: (m) => {
      // Invalidate any in-flight generation so its result cannot land in the
      // new mode's results list.
      requestCounter += 1;
      abortController?.abort();
      abortController = null;
      set({ mode: m, results: [], error: null, latencyMs: 0, source: "heuristic", model: null, loading: false });
    },

    setEngineMode: (m) => {
      try {
        localStorage.setItem(ENGINE_MODE_KEY, m);
      } catch {
        /* storage may be unavailable (private mode) */
      }
      set({ engineMode: m, error: null });
    },

    setProviderConfig: (config) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
      } catch {
        /* ignore quota / privacy mode errors */
      }
      set({ providerConfig: config, error: null });
    },

    clear: () =>
      set({
        input: "",
        results: [],
        error: null,
        latencyMs: 0,
        source: "heuristic",
        model: null,
      }),

    cancelRequest: () => {
      requestCounter += 1;
      abortController?.abort();
      abortController = null;
      set({ loading: false });
    },

    getResults: async (options = {}) => {
      const state = get();
      const cleanInput = state.input.trim();
      if (!cleanInput) return;
      const refresh = options?.refresh === true;

      const requestId = ++requestCounter;
      abortController?.abort();
      abortController = new AbortController();
      const { signal } = abortController;

      const localResults = localHeuristics(state.mode, cleanInput, state.style, state.language);
      const startedAt = performance.now();
      const elapsed = () => Math.round(performance.now() - startedAt);

      // Cancelled requests must never touch the store again.
      const commit = (partial) => {
        if (isStale(requestId) || signal.aborted) return false;
        set(partial);
        return true;
      };

      set({ loading: true, error: null, results: [], latencyMs: 0 });

      // ---- On-device only ------------------------------------------------
      if (state.engineMode === "offline-only") {
        commit({
          results: localResults,
          source: "heuristic",
          latencyMs: elapsed(),
          model: "on-device-rules",
          loading: false,
        });
        return;
      }

      const hasClientKey = Boolean(state.providerConfig?.apiKey?.trim());
      const isLocalProvider = isLocalEndpoint(state.providerConfig?.baseURL || "");

      // ---- Shown instantly in hybrid mode, and used as the fallback ------
      const serveLocal = (model = "on-device-rules") =>
        commit({
          results: localResults,
          source: "heuristic",
          latencyMs: elapsed(),
          model,
          loading: false,
        });

      // Abort the in-flight fetch when the deadline passes so we never keep a
      // request (and its connection) alive after the UI moved on.
      const abortOnTimeout = () => abortController?.abort();

      const callCloud = (timeoutMs) => {
        if (hasClientKey || isLocalProvider) {
          return withTimeout(
            callClientCloudLLM({
              providerConfig: state.providerConfig,
              prompt: buildPrompt(state.mode, cleanInput, state.style, state.language, refresh),
              signal,
            }),
            timeoutMs,
            abortOnTimeout
          );
        }
        // No BYOK credentials: use the shared backend when it is reachable.
        return withTimeout(
          callBackendApi({
            endpoint: BACKEND_ENDPOINT,
            mode: state.mode,
            input: cleanInput,
            style: state.style,
            language: state.language,
            refresh,
            signal,
          }),
          timeoutMs,
          abortOnTimeout
        );
      };

      // ---- Hybrid race: local answer first, cloud upgrade when it lands --
      if (state.engineMode === "hybrid-race") {
        // Publish the zero-latency answer immediately (loading stays true so
        // the UI can show that an upgrade is still in flight).
        if (
          !commit({
            results: localResults,
            source: "heuristic",
            latencyMs: elapsed(),
            model: "on-device-rules",
            loading: true,
          })
        ) {
          return;
        }

        try {
          const outcome = await callCloud(HYBRID_TIMEOUT_MS);
          if (outcome?.results?.length) {
            commit({
              results: outcome.results,
              source: outcome.source,
              latencyMs: outcome.latencyMs ?? elapsed(),
              model: outcome.model,
              loading: false,
              error: null,
            });
          } else {
            commit({ loading: false });
          }
        } catch (error) {
          if (error.name === "AbortError" || isStale(requestId)) return;
          // Keep the local answer; surface a soft hint at most.
          commit({ loading: false });
        }
        return;
      }

      // ---- Cloud only ----------------------------------------------------
      try {
        const outcome = await callCloud(CLOUD_TIMEOUT_MS);
        const landed = commit({
          results: outcome.results,
          source: outcome.source,
          latencyMs: outcome.latencyMs ?? elapsed(),
          model: outcome.model,
          error: null,
          loading: false,
        });
        if (!landed) return;
      } catch (error) {
        if (error.name === "AbortError" || isStale(requestId)) return;
        const message =
          error.message === "RequestTimeout"
            ? "Cloud provider timed out — showing instant on-device results instead."
            : hasClientKey || isLocalProvider
              ? `Cloud provider unavailable (${error.message}). Showing on-device results.`
              : "No cloud credentials configured. Add an API key in Settings, or use the shared backend.";
        commit({ error: message });
        serveLocal("fallback-rules");
      }
    },
  };
});
