import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getHeuristicReplies,
  getHeuristicEnhancements,
  getHeuristicTranslations,
  getHeuristicSummary
} from "../services/heuristicEngine.js";

describe("Backend Heuristic Engine Tests", () => {
  test("getHeuristicReplies returns contextual replies for greeting", () => {
    const replies = getHeuristicReplies("Hello team, hope you are doing well", "professional");
    assert.ok(Array.isArray(replies));
    assert.ok(replies.length > 0);
    assert.strictEqual(typeof replies[0], "string");
  });

  test("getHeuristicEnhancements normalizes text and capitalization", () => {
    const enhanced = getHeuristicEnhancements("hey please check this pr asap", "friendly");
    assert.ok(Array.isArray(enhanced));
    assert.ok(enhanced.length > 0);
    assert.match(enhanced[0], /^[A-Z]/);
  });

  test("getHeuristicTranslations translates common dictionary entries", () => {
    const translations = getHeuristicTranslations("thank you", "spanish", "formal");
    assert.ok(Array.isArray(translations));
    assert.ok(translations.some(t => /gracias/i.test(t)));
  });

  test("getHeuristicSummary produces bullet points and condensed summary", () => {
    const text = "Antigravity is an advanced agentic framework. It provides pair programming capabilities. Developers can automate multiplatform workflows.";
    const summary = getHeuristicSummary(text);
    assert.ok(Array.isArray(summary));
    assert.ok(summary.some(s => s.includes("•")));
  });
});
