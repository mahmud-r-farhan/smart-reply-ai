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

/**
 * Extra allowlisted origins supplied by the operator, e.g.
 * `LLM_ALLOWED_HOSTS=https://llm.internal:8443,http://192.168.1.10:11434`.
 * Read lazily (and memoized) so tests and hot-reloads see env changes.
 */
let allowedHostsCache = { raw: null, origins: new Set() };

const getExtraAllowedOrigins = () => {
  const raw = process.env.LLM_ALLOWED_HOSTS || "";
  if (allowedHostsCache.raw === raw) return allowedHostsCache.origins;

  const origins = new Set();
  for (const entry of raw.split(",").map((value) => value.trim()).filter(Boolean)) {
    const url = parseOrigin(entry.includes("://") ? entry : `https://${entry}`);
    if (url) origins.add(url.origin);
  }
  allowedHostsCache = { raw, origins };
  return origins;
};

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

const stripBrackets = (hostname) => hostname.replace(/^\[|\]$/g, "");

/** IPv4-mapped IPv6 (`::ffff:a.b.c.d`) — unwrap to the embedded IPv4 address. */
const unwrapMappedIpv4 = (host) => {
  const match = host.match(/^::ffff:(.+)$/i);
  if (!match) return null;
  const tail = match[1];
  if (tail.includes(".")) return tail;
  const hextets = tail.split(":");
  if (hextets.length !== 2 || hextets.some((h) => !/^[0-9a-f]{1,4}$/i.test(h))) return null;
  return hextets
    .flatMap((h) => {
      const value = h.padStart(4, "0");
      return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2), 16)];
    })
    .join(".");
};

const isBlockedHostname = (hostname) => {
  const host = stripBrackets(hostname.toLowerCase());
  if (METADATA_HOSTNAMES.has(host)) return true;
  if (isPrivateIpv4(host)) return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (/^f[cd][0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return true;
  // IPv4-mapped IPv6 (::ffff:169.254.169.254 and friends)
  const mapped = unwrapMappedIpv4(host);
  if (mapped && isPrivateIpv4(mapped)) return true;
  return false;
};

const isLocalOriginAllowed = (url) =>
  LOCAL_HOSTNAMES.has(stripBrackets(url.hostname.toLowerCase())) &&
  // Only the canonical Ollama port is exempted; other local services
  // (databases, admin UIs, cloud metadata proxies...) stay unreachable.
  url.port === "11434";

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

    const host = stripBrackets(url.hostname.toLowerCase());
    if (METADATA_HOSTNAMES.has(host)) {
      throw new HttpError("providerConfig.baseURL points to a cloud metadata address");
    }
    // Private/LAN endpoints are only reachable when the operator explicitly
    // allowlists the origin (LLM_ALLOWED_HOSTS) or it is the local Ollama port;
    // an attacker can set neither.
    if (
      isBlockedHostname(url.hostname) &&
      !isLocalOriginAllowed(url) &&
      !getExtraAllowedOrigins().has(url.origin)
    ) {
      throw new HttpError("providerConfig.baseURL points to a blocked (private) address");
    }

    if (presetOrigins.has(url.origin) || getExtraAllowedOrigins().has(url.origin)) {
      trusted = true;
    } else if (allowCustomEndpoints()) {
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
  return Boolean(url && LOCAL_HOSTNAMES.has(stripBrackets(url.hostname.toLowerCase())));
};

export const providerResolverInternals = {
  presetOrigins,
  stripBrackets,
  getExtraAllowedOrigins,
  isBlockedHostname,
  isLocalOriginAllowed,
  allowCustomEndpoints,
};
