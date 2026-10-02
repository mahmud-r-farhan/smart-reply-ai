import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../server.js";

let server;
let baseUrl;

const post = async (path, body, headers = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    /* non-JSON response */
  }
  return { response, json };
};

describe("HTTP API integration", () => {
  before(async () => {
    delete process.env.ALLOW_CUSTOM_LLM_ENDPOINT;
    server = await startServer(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test("GET /health reports a healthy service with security headers", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-powered-by"), null);
  });

  test("GET /ready returns readiness", async () => {
    const response = await fetch(`${baseUrl}/ready`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ready, true);
  });

  test("GET /api/providers exposes presets and formats", async () => {
    const response = await fetch(`${baseUrl}/api/providers`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.presets.groq.baseURL.includes("groq.com"));
    assert.ok(body.formats.includes("professional"));
  });

  test("POST /api/suggest-reply falls back to the heuristic engine without a key", async () => {
    const { response, json } = await post("/api/suggest-reply", {
      message: "Can we meet tomorrow at 3 PM?",
    });

    assert.equal(response.status, 200);
    assert.equal(json.suggestions.length, 4);
    assert.equal(json.source, "heuristic");
    assert.ok(json.latencyMs >= 0);
  });

  test("POST /api/enhance-text validates the payload type", async () => {
    const { response, json } = await post("/api/enhance-text", { text: 12345 });
    assert.equal(response.status, 400);
    assert.match(json.error, /string/i);
  });

  test("POST /api/translate-text validates the language", async () => {
    const { response } = await post("/api/translate-text", {
      text: "hello",
      language: "<script>alert(1)</script>",
    });
    assert.equal(response.status, 400);
  });

  test("POST /api/translate-text translates dictionary phrases offline", async () => {
    const { response, json } = await post("/api/translate-text", {
      text: "thank you",
      language: "spanish",
    });
    assert.equal(response.status, 200);
    assert.ok(json.translations.some((entry) => /gracias/i.test(entry)));
  });

  test("POST /api/summarize-text enforces the 8000 character limit", async () => {
    const { response, json } = await post("/api/summarize-text", {
      text: "a".repeat(9000),
    });
    assert.equal(response.status, 400);
    assert.match(json.error, /8000/);
  });

  test("POST /api/summarize-text accepts realistic long input (payload limit is large enough)", async () => {
    const text = "Sentence about the product roadmap and delivery. ".repeat(150).trim();
    const { response, json } = await post("/api/summarize-text", { text });
    assert.equal(response.status, 200);
    assert.equal(json.summaries.length, 4);
  });

  test("rejects unknown formats with a helpful message", async () => {
    const { response, json } = await post("/api/suggest-reply", {
      message: "hello",
      format: "sarcastic",
    });
    assert.equal(response.status, 400);
    assert.match(json.error, /Invalid format/);
  });

  test("blocks SSRF attempts through providerConfig", async () => {
    const { response, json } = await post("/api/suggest-reply", {
      message: "hello",
      providerConfig: { baseURL: "http://169.254.169.254/latest/meta-data" },
    });
    assert.equal(response.status, 400);
    assert.match(json.error, /blocked|disabled/i);
  });

  test("returns 400 for malformed JSON bodies", async () => {
    const { response, json } = await post("/api/suggest-reply", "{not-json");
    assert.equal(response.status, 400);
    assert.equal(json.error, "Invalid JSON payload");
  });

  test("returns 404 for unknown endpoints", async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Endpoint not found" });
  });

  test("exposes cache telemetry", async () => {
    const response = await fetch(`${baseUrl}/api/stats`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.cache);
    assert.equal(typeof body.singleflightInFlight, "number");
  });
});
