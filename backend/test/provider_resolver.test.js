import { test, describe, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resolveProvider } from "../utils/providerResolver.js";
import { HttpError } from "../utils/validation.js";

const ORIGINAL_ENV = { ...process.env };

const resetEnv = () => {
  for (const key of [
    "LLM_API_KEY",
    "OPENROUTER_API_KEY",
    "LLM_BASE_URL",
    "ALLOW_CUSTOM_LLM_ENDPOINT",
    "LLM_MODEL",
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
  for (const key of [
    "LLM_API_KEY",
    "OPENROUTER_API_KEY",
    "LLM_BASE_URL",
    "ALLOW_CUSTOM_LLM_ENDPOINT",
    "LLM_MODEL",
  ]) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
  }
};

describe("Provider resolver — SSRF & credential protection", () => {
  beforeEach(() => {
    delete process.env.ALLOW_CUSTOM_LLM_ENDPOINT;
    delete process.env.LLM_BASE_URL;
    process.env.OPENROUTER_API_KEY = "server-secret-key";
  });

  afterEach(resetEnv);

  test("uses the trusted default endpoint and server key when no config is supplied", () => {
    const resolved = resolveProvider(null, "SUGGESTIONS");
    assert.equal(resolved.baseURL, "https://openrouter.ai/api/v1");
    assert.equal(resolved.apiKey, "server-secret-key");
    assert.equal(resolved.trusted, true);
  });

  test("accepts known provider presets and keeps the server key available", () => {
    const resolved = resolveProvider(
      { baseURL: "https://api.groq.com/openai/v1", model: "llama-3.1-8b-instant" },
      "SUGGESTIONS"
    );
    assert.equal(resolved.baseURL, "https://api.groq.com/openai/v1");
    assert.equal(resolved.apiKey, "server-secret-key");
    assert.equal(resolved.model, "llama-3.1-8b-instant");
  });

  test("rejects cloud metadata and private-range endpoints", () => {
    for (const baseURL of [
      "http://169.254.169.254/latest/meta-data",
      "http://10.0.0.5:8080/v1",
      "http://192.168.1.10:5000/v1",
      "http://172.20.0.1/v1",
    ]) {
      assert.throws(
        () => resolveProvider({ baseURL }, "SUGGESTIONS"),
        (error) => error instanceof HttpError && error.status === 400,
        `expected ${baseURL} to be rejected`
      );
    }
  });

  test("rejects arbitrary custom endpoints by default", () => {
    assert.throws(
      () => resolveProvider({ baseURL: "https://evil.example.com/v1" }, "SUGGESTIONS"),
      HttpError
    );
  });

  test("never forwards the server key to a custom endpoint, even when enabled", () => {
    process.env.ALLOW_CUSTOM_LLM_ENDPOINT = "true";
    const resolved = resolveProvider({ baseURL: "https://my-llm.example.com/v1" }, "SUGGESTIONS");
    assert.equal(resolved.trusted, false);
    assert.equal(resolved.apiKey, "");
  });

  test("still honours a caller-supplied key for a custom endpoint", () => {
    process.env.ALLOW_CUSTOM_LLM_ENDPOINT = "true";
    const resolved = resolveProvider(
      { baseURL: "https://my-llm.example.com/v1", apiKey: "user-key" },
      "SUGGESTIONS"
    );
    assert.equal(resolved.apiKey, "user-key");
  });

  test("rejects non-http(s) protocols and malformed URLs", () => {
    process.env.ALLOW_CUSTOM_LLM_ENDPOINT = "true";
    for (const baseURL of ["file:///etc/passwd", "ftp://example.com/v1", "not a url"]) {
      assert.throws(() => resolveProvider({ baseURL }, "SUGGESTIONS"), HttpError);
    }
  });

  test("allows the canonical local Ollama endpoint without a key", () => {
    const resolved = resolveProvider(
      { baseURL: "http://localhost:11434/v1", model: "llama3.2:latest" },
      "SUGGESTIONS"
    );
    assert.equal(resolved.trusted, true);
  });

  test("rejects other local ports by default (internal service probing)", () => {
    assert.throws(
      () => resolveProvider({ baseURL: "http://127.0.0.1:6379/v1" }, "SUGGESTIONS"),
      HttpError
    );
  });

  test("validates numeric knobs and model identifiers", () => {
    assert.throws(
      () => resolveProvider({ temperature: 9 }, "SUGGESTIONS"),
      HttpError
    );
    assert.throws(
      () => resolveProvider({ maxTokens: 100000 }, "SUGGESTIONS"),
      HttpError
    );
    assert.throws(
      () => resolveProvider({ model: "bad\nmodel" }, "SUGGESTIONS"),
      HttpError
    );
  });

  test("clamps/accepts valid temperature and maxTokens", () => {
    const resolved = resolveProvider({ temperature: 0.2, maxTokens: 512 }, "SUGGESTIONS");
    assert.equal(resolved.temperature, 0.2);
    assert.equal(resolved.maxTokens, 512);
  });
});
