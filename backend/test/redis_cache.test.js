import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { RedisClient, RedisCache } from "../utils/redisClient.js";
import { CacheManager } from "../utils/cacheManager.js";

/** Parse one RESP command from a buffer; returns null when incomplete. */
const parseCommand = (buffer) => {
  if (buffer.length === 0) return null;
  if (buffer[0] !== 0x2a) return null; // expects '*'
  const lineEnd = buffer.indexOf("\r\n");
  if (lineEnd === -1) return null;

  const count = Number.parseInt(buffer.subarray(1, lineEnd).toString(), 10);
  let cursor = lineEnd + 2;
  const args = [];

  for (let i = 0; i < count; i++) {
    if (buffer[cursor] !== 0x24) return null; // expects '$'
    const lengthEnd = buffer.indexOf("\r\n", cursor);
    if (lengthEnd === -1) return null;
    const length = Number.parseInt(buffer.subarray(cursor + 1, lengthEnd).toString(), 10);
    const start = lengthEnd + 2;
    const end = start + length;
    if (buffer.length < end + 2) return null;
    args.push(buffer.subarray(start, end).toString("utf8"));
    cursor = end + 2;
  }

  return { args, offset: cursor };
};

/** Start a tiny in-process Redis lookalike (PING / GET / SET only). */
const startFakeRedis = () =>
  new Promise((resolve) => {
    const store = new Map();
    const server = net.createServer((socket) => {
      let buffer = Buffer.alloc(0);
      socket.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        for (;;) {
          const parsed = parseCommand(buffer);
          if (!parsed) break;
          buffer = buffer.subarray(parsed.offset);
          const [command, ...args] = parsed.args;
          switch (command.toUpperCase()) {
            case "PING":
              socket.write("+PONG\r\n");
              break;
            case "GET": {
              const value = store.get(args[0]);
              if (value === undefined) socket.write("$-1\r\n");
              else socket.write(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
              break;
            }
            case "SET":
              store.set(args[0], args[1]);
              socket.write("+OK\r\n");
              break;
            case "AUTH":
            case "SELECT":
              socket.write("+OK\r\n");
              break;
            default:
              socket.write(`-ERR unknown command '${command}'\r\n`);
          }
        }
      });
    });

    server.listen(0, "127.0.0.1", () => {
      resolve({
        store,
        port: server.address().port,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });

describe("Distributed Redis cache tier", () => {
  let fake;

  before(async () => {
    fake = await startFakeRedis();
  });

  after(async () => {
    await fake.close();
  });

  test("RedisClient performs a PING/PONG handshake and SET/GET round trip", async () => {
    const client = new RedisClient(`redis://127.0.0.1:${fake.port}`, { timeoutMs: 1000 });
    assert.equal(await client.ping(), true);

    await client.command("SET", "greeting", JSON.stringify(["hi"]), "PX", 5000);
    const raw = await client.command("GET", "greeting");
    assert.deepEqual(JSON.parse(raw), ["hi"]);
    assert.equal(await client.command("GET", "missing"), null);
    client.close();
  });

  test("RedisClient surfaces server error replies as rejections", async () => {
    const client = new RedisClient(`redis://127.0.0.1:${fake.port}`, { timeoutMs: 1000 });
    await assert.rejects(() => client.command("FLUSHALL"), /ERR/);
    client.close();
  });

  test("CacheManager shares entries across replicas through Redis", async () => {
    const url = `redis://127.0.0.1:${fake.port}`;
    const replicaA = new CacheManager(60_000, 10, { redisUrl: url });
    const replicaB = new CacheManager(60_000, 10, { redisUrl: url });

    const key = replicaA.generateKey("shared prompt", "model-x");
    await replicaA.setAsync(key, ["reply one", "reply two"]);

    // Warm L1 on replica A
    assert.deepEqual(await replicaA.getAsync(key), ["reply one", "reply two"]);

    // Replica B has a cold L1 but reads through to Redis
    const fromB = await replicaB.getAsync(key);
    assert.deepEqual(fromB, ["reply one", "reply two"]);
    assert.ok(replicaB.getStats().distributedHits >= 1);

    replicaA.distributed.close();
    replicaB.distributed.close();
  });

  test("fails open to the in-memory tier when Redis is unreachable", async () => {
    const manager = new CacheManager(60_000, 10, { redisUrl: "redis://127.0.0.1:1" });

    const key = manager.generateKey("offline prompt");
    await manager.setAsync(key, ["local only"]);

    const value = await manager.getAsync(key);
    assert.deepEqual(value, ["local only"]);
    assert.equal(manager.distributed.enabled, false, "circuit breaker should open");
    assert.ok(manager.distributed.stats.errors > 0);
    assert.equal(manager.getStats().distributedAvailable, false);
  });

  test("a rejected Redis operation is a cache miss, never an exception", async () => {
    const cache = new RedisCache("redis://127.0.0.1:1", { timeoutMs: 200 });
    assert.equal(await cache.get("whatever"), null);
    assert.equal(await cache.set("whatever", [1, 2], 1000), false);
    assert.equal(cache.enabled, false);
  });
});
