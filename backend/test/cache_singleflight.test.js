import { test, describe } from "node:test";
import assert from "node:assert/strict";
import cacheManager from "../utils/cacheManager.js";
import singleflight from "../utils/singleflight.js";

describe("Cache & Singleflight Scalability Tests", () => {
  test("CacheManager stores and retrieves entries with metrics", () => {
    const key = cacheManager.generateKey("hello world", "llama3");
    cacheManager.set(key, ["Hi there", "Hello!"]);
    
    assert.strictEqual(cacheManager.has(key), true);
    const retrieved = cacheManager.get(key);
    assert.deepStrictEqual(retrieved, ["Hi there", "Hello!"]);

    const stats = cacheManager.getStats();
    assert.ok(stats.hits >= 1);
    assert.ok(stats.valid >= 1);
  });

  test("Singleflight coalesces concurrent duplicate calls into 1 execution", async () => {
    let executionCount = 0;
    const expensiveOperation = async () => {
      executionCount++;
      await new Promise(r => setTimeout(r, 20));
      return { result: "computed_value" };
    };

    // Fire 5 identical requests concurrently
    const promises = [
      singleflight.do("test_flight_key", expensiveOperation),
      singleflight.do("test_flight_key", expensiveOperation),
      singleflight.do("test_flight_key", expensiveOperation),
      singleflight.do("test_flight_key", expensiveOperation),
      singleflight.do("test_flight_key", expensiveOperation),
    ];

    const results = await Promise.all(promises);

    // All callers received the result
    assert.strictEqual(results.length, 5);
    for (const res of results) {
      assert.strictEqual(res.result, "computed_value");
    }

    // But the expensive operation only ran ONCE!
    assert.strictEqual(executionCount, 1);
  });
});
