/**
 * Shared request validation helpers.
 *
 * Every controller validates untrusted JSON input through these helpers so that
 * malformed payloads always produce a clean HTTP 400 instead of a 500 TypeError.
 */

/** Per-operation maximum input lengths (characters). */
export const LIMITS = {
  SUGGEST: 2000,
  ENHANCE: 2000,
  TRANSLATE: 2000,
  SUMMARIZE: 8000,
};

/** Error carrying an HTTP status code, understood by the global error handler. */
export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validate and normalize a required text field.
 * @param {unknown} value Raw request value
 * @param {object} options
 * @param {string} options.field Human readable field name used in error messages
 * @param {number} [options.max] Maximum accepted character length
 * @param {number} [options.min] Minimum accepted character length (after trimming)
 * @returns {string} Trimmed text
 */
export const requireText = (value, { field = "Text", max = 2000, min = 1 } = {}) => {
  if (typeof value !== "string") {
    throw new HttpError(`${field} must be a string`);
  }
  const clean = value.trim();
  if (clean.length < min) {
    throw new HttpError(`${field} is required`);
  }
  if (clean.length > max) {
    throw new HttpError(`${field} must be under ${max} characters`);
  }
  return clean;
};

/**
 * Validate a tone/format identifier. Falls back to a default when omitted.
 * Aliases (for example the legacy "flating" token) are normalized to their
 * canonical value before validation.
 */
export const requireFormat = (value, { fallback, validFormats, aliases = {} }) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") {
    throw new HttpError("Invalid format");
  }
  const lower = value.trim().toLowerCase();
  const normalized = aliases[lower] || lower;
  if (!validFormats.includes(normalized)) {
    throw new HttpError(`Invalid format. Supported formats: ${validFormats.join(", ")}`);
  }
  return normalized;
};

/**
 * Validate a target language name (letters, spaces and dashes only).
 */
export const requireLanguage = (value, { fallback = "english", max = 40 } = {}) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") {
    throw new HttpError("Language must be a string");
  }
  const clean = value.trim();
  if (clean.length === 0) return fallback;
  if (clean.length > max || !/^[a-zA-Z\u00C0-\u024F\u0900-\u097F\s\-']+$/.test(clean)) {
    throw new HttpError("Invalid language");
  }
  return clean;
};

/**
 * Validate the optional BYOK provider configuration envelope.
 * The actual URL/credential resolution happens in providerResolver.js.
 */
export const requireProviderConfig = (value) => {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw new HttpError("providerConfig must be an object");
  }
  return value;
};

/**
 * Validate an optional numeric knob (temperature, maxTokens...).
 */
export const optionalNumber = (value, { field, min, max, fallback }) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new HttpError(`${field} must be a number`);
  }
  if (num < min || num > max) {
    throw new HttpError(`${field} must be between ${min} and ${max}`);
  }
  return num;
};

export { isPlainObject };
