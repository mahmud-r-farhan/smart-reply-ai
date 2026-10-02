import { PROVIDER_PRESETS, getDefaultModel } from "./modelSelector.js";
import { HttpError, optionalNumber } from "./validation.js";

/**
 * Provider resolution & SSRF protection.
 *
 * The backend accepts an optional OpenAI-compatible `providerConfig` (BYOK) from
 * clients. Allowing arbitrary `baseURL` values would turn the service into an
 * open proxy: an attacker could point it at `http://169.254.169.254/` or any
 * internal host, and — worse — the server's own `OPENROUTER_API_KEY` would be
 * attached to that request as a Bearer token.
 *
 * Resolution rules:
 *   1. No `baseURL` provided -> trusted default endpoint (env or OpenRouter).
 *      Server-side API keys may be used.
 *   2. `baseURL` matches a known provider origin (or `LLM_ALLOWED_HOSTS`) ->
 *      treated as trusted; the server-side key may be used.
 *   3. `baseURL` is custom:
 *        - rejected unless `ALLOW_CUSTOM_LLM_ENDPOINT=true`
 *        - never receives the server-side API key, only the caller's own key
 *        - link-local / cloud-metadata addresses stay blocked in every case
 */

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "[::1]"]);

const METADATA_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

const parseOrigin = (rawUrl) => {
  try {
    const url = new URL(rawUrl);
    return url;
  } catch {
    return null;
  }
};

/** Known provider origins derived from the shared presets (protocol://host:port). */
const presetOrigins = new Set(
  Object.values(PROVIDER_PRESETS)
    .map((preset) => parseOrigin(preset.baseURL))
    .filter(Boolean)
    .map((url) => url.origin)
);

/** Extra allowlisted origins supplied by the operator, e.g. "https://llm.internal:8443". */
const extraAllowedOrigins = new Set(
  (process.env.LLM_ALLOWED_HOSTS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const url = parseOrigin(entry.includes("://") ? entry : `https://${entry}`);
      return url ? url.origin : null;
    })
    .filter(Boolean)
);

const isIpv4 = (hostname) => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

const isPrivateIpv4 = (hostname) => {
  if (!isIpv4(hostname)) return false;
  const [a, b] = hostname.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) || // link-local + cloud metadata
    a === 0
  );
};

const isBlockedHostname = (hostname) => {
  const host = hostname.toLowerCase();
  if (METADATA_HOSTNAMES.has(host)) return true;
  if (isPrivateIpv4(host)) return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (/^f[cd][0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return true;
  return false;
};

const isLocalOriginAllowed = (url) =>
  LOCAL_HOSTNAMES.has(url.hostname.toLowerCase()) &&
  // Only the canonical Ollama port is exempted by default; other local services
  // (databases, admin UIs, cloud metadata proxies...) stay unreachable.
  (!url.port || url.port === "11434");

const truthy = (value) => /^(1|true|yes|on)$/i.test(String(value || "").trim());

const allowCustomEndpoints = () => truthy(process.env.ALLOW_CUSTOM_LLM_ENDPOINT);

/**
 * Resolve the effective provider configuration for one LLM call.
 *
 * @param {object|null} providerConfig Untrusted client payload
 * @param {string} operationType SUGGESTIONS | ENHANCEMENTS | TRANSLATIONS | SUMMARIZATION
 * @returns {{ baseURL: string, apiKey: string, model: string, temperature: number, maxTokens: number, trusted: boolean }}
 * @throws {HttpError} when the supplied configuration is not permitted
 */
export const resolveProvider = (providerConfig, operationType = "SUGGESTIONS") => {
  const envBaseURL = process.env.LLM_BASE_URL || PROVIDER_PRESETS.openrouter.baseURL;
  const envApiKey = process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || "";

  const suppliedBaseURL =
    typeof providerConfig?.baseURL === "string" ? providerConfig.baseURL.trim() : "";
  const suppliedApiKey =
    typeof providerConfig?.apiKey === "string" ? providerConfig.apiKey.trim() : "";

  if (suppliedApiKey.length > 512) {
    throw new HttpError("Invalid API key");
  }

  let baseURL = suppliedBaseURL || envBaseURL;
  let trusted = !suppliedBaseURL; // implicit (env) endpoint is operator-controlled

  if (suppliedBaseURL) {
    if (suppliedBaseURL.length > 300) {
      throw new HttpError("Invalid baseURL");
    }

    const url = parseOrigin(suppliedBaseURL);
    if (!url) {
      throw new HttpError("providerConfig.baseURL must be a valid URL");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new HttpError("providerConfig.baseURL must use http or https");
    }

    if (isBlockedHostname(url.hostname) && !isLocalOriginAllowed(url)) {
      throw new HttpError("providerConfig.baseURL points to a blocked (private) address");
    }

    if (presetOrigins.has(url.origin) || extraAllowedOrigins.has(url.origin)) {
      trusted = true;
    } else if (allowCustomEndpoints() && !METADATA_HOSTNAMES.has(url.hostname)) {
      trusted = false; // allowed, but never receives the server-side secret
    } else {
      throw new HttpError(
        "Custom provider endpoints are disabled. Use a known provider or set ALLOW_CUSTOM_LLM_ENDPOINT=true."
      );
    }

    baseURL = suppliedBaseURL.replace(/\/+$/, "");
  }

  // The server-side key is only ever attached to trusted (allowlisted) origins.
  const apiKey = suppliedApiKey || (trusted ? envApiKey : "");

  const model =
    (typeof providerConfig?.model === "string" && providerConfig.model.trim()) ||
    process.env.LLM_MODEL ||
    getDefaultModel(operationType);

  if (model.length > 120 || /[\r\n]/.test(model)) {
    throw new HttpError("Invalid model identifier");
  }

  const temperature = optionalNumber(providerConfig?.temperature, {
    field: "providerConfig.temperature",
    min: 0,
    max: 2,
    fallback: 0.7,
  });
  const maxTokens = optionalNumber(providerConfig?.maxTokens, {
    field: "providerConfig.maxTokens",
    min: 16,
    max: 2048,
    fallback: 350,
  });

  return { baseURL, apiKey, model, temperature, maxTokens, trusted };
};

/** True when the endpoint is a local (Ollama-style) server. */
export const isLocalEndpoint = (baseURL) => {
  const url = parseOrigin(baseURL);
  return Boolean(url && LOCAL_HOSTNAMES.has(url.hostname.toLowerCase()));
};

export const providerResolverInternals = {
  presetOrigins,
  extraAllowedOrigins,
  isBlockedHostname,
  isLocalOriginAllowed,
  allowCustomEndpoints,
};
