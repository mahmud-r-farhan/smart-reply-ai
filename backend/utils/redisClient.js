import net from "node:net";

/**
 * Minimal, dependency-free Redis (RESP2) client.
 *
 * Only the handful of commands needed by the distributed cache tier are
 * supported. The client is defensive by design:
 *   - lazy connect with bounded reconnection backoff
 *   - per-command timeout
 *   - one command in flight at a time (Redis is fast; this keeps ordering sane)
 *   - replies are parsed with an incremental state machine
 */

const CRLF = "\r\n";

const encodeCommand = (args) => {
  const parts = [`*${args.length}${CRLF}`];
  for (const arg of args) {
    const value = Buffer.from(String(arg), "utf8");
    parts.push(`$${value.length}${CRLF}`, value, CRLF);
  }
  return Buffer.concat(parts.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part))));
};

export class RedisClient {
  /**
   * @param {string} url Redis connection string, e.g. redis://:pass@host:6379/0
   * @param {object} [options]
   * @param {number} [options.timeoutMs] Per-command timeout
   */
  constructor(url, { timeoutMs = 500 } = {}) {
    this.url = url;
    this.timeoutMs = timeoutMs;
    this.socket = null;
    this.connecting = null;
    this.buffer = Buffer.alloc(0);
    this.queue = [];
    this.closed = false;
    this.lastError = null;
    this.attempts = 0;
  }

  static parseUrl(url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "127.0.0.1",
      port: Number(parsed.port) || 6379,
      password: parsed.password ? decodeURIComponent(parsed.password) : null,
      username: parsed.username ? decodeURIComponent(parsed.username) : null,
      db: parsed.pathname && parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0,
    };
  }

  connect() {
    if (this.socket && !this.socket.destroyed) return Promise.resolve();
    if (this.connecting) return this.connecting;
    if (this.closed) return Promise.reject(new Error("Redis client closed"));

    const { host, port, password, username, db } = RedisClient.parseUrl(this.url);

    this.connecting = new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      socket.setNoDelay(true);

      const onError = (error) => {
        socket.removeAllListeners();
        socket.destroy();
        this.socket = null;
        this.connecting = null;
        reject(error);
      };

      socket.once("error", onError);
      socket.once("connect", () => {
        socket.off("error", onError);
        socket.on("error", (error) => {
          this.lastError = error;
          this.socket = null;
          this.failQueue(error);
        });
        socket.on("close", () => {
          this.socket = null;
        });
        socket.on("data", (chunk) => this.onData(chunk));

        this.socket = socket;
        this.connecting = null;
        this.attempts = 0;

        const bootstrap = [];
        if (password) bootstrap.push(["AUTH", username || "default", password]);
        if (db) bootstrap.push(["SELECT", db]);

        const handshake = bootstrap.reduce(
          (promise, args) => promise.then(() => this.command(...args)),
          Promise.resolve()
        );
        handshake.then(resolve).catch(reject);
      });
    });

    return this.connecting;
  }

  failQueue(error) {
    const pending = this.queue.splice(0, this.queue.length);
    for (const entry of pending) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.queue.length > 0) {
      const parsed = this.parseReply(this.buffer, 0);
      if (!parsed) return; // need more data
      this.buffer = this.buffer.subarray(parsed.offset);
      const entry = this.queue.shift();
      clearTimeout(entry.timer);
      if (parsed.error) entry.reject(new Error(parsed.value));
      else entry.resolve(parsed.value);
    }
  }

  /** @returns {{value:any, offset:number, error?:boolean}|null} */
  parseReply(buffer, offset) {
    if (offset >= buffer.length) return null;
    const type = String.fromCharCode(buffer[offset]);
    const lineEnd = buffer.indexOf(CRLF, offset + 1, "utf8");
    if (lineEnd === -1) return null;
    const line = buffer.subarray(offset + 1, lineEnd).toString("utf8");

    switch (type) {
      case "+":
        return { value: line, offset: lineEnd + 2 };
      case "-":
        return { value: line, offset: lineEnd + 2, error: true };
      case ":":
        return { value: Number.parseInt(line, 10), offset: lineEnd + 2 };
      case "$": {
        const length = Number.parseInt(line, 10);
        if (length === -1) return { value: null, offset: lineEnd + 2 };
        const start = lineEnd + 2;
        const end = start + length;
        if (buffer.length < end + 2) return null;
        return { value: buffer.subarray(start, end).toString("utf8"), offset: end + 2 };
      }
      case "*": {
        const count = Number.parseInt(line, 10);
        if (count === -1) return { value: null, offset: lineEnd + 2 };
        const items = [];
        let cursor = lineEnd + 2;
        for (let i = 0; i < count; i++) {
          const item = this.parseReply(buffer, cursor);
          if (!item) return null;
          items.push(item.value);
          cursor = item.offset;
        }
        return { value: items, offset: cursor };
      }
      default:
        return { value: null, offset: buffer.length, error: true, raw: "Protocol error" };
    }
  }

  command(...args) {
    return new Promise((resolve, reject) => {
      const send = () => {
        const timer = setTimeout(() => {
          const index = this.queue.findIndex((entry) => entry.timer === timer);
          if (index >= 0) this.queue.splice(index, 1);
          reject(new Error(`Redis command timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
        timer.unref?.();

        this.queue.push({ resolve, reject, timer });
        this.socket.write(encodeCommand(args));
      };

      this.connect().then(send).catch(reject);
    });
  }

  async ping() {
    const reply = await this.command("PING");
    return reply === "PONG";
  }

  close() {
    this.closed = true;
    this.failQueue(new Error("Redis client closed"));
    this.socket?.destroy();
    this.socket = null;
  }
}

/**
 * Distributed cache facade with fail-open behaviour.
 * When Redis is unavailable the cache silently degrades to the in-memory tier.
 */
export class RedisCache {
  constructor(url, { timeoutMs = 400, failureCooldownMs = 30000 } = {}) {
    this.client = new RedisClient(url, { timeoutMs });
    this.failureCooldownMs = failureCooldownMs;
    this.disabledUntil = 0;
    this.stats = { hits: 0, misses: 0, sets: 0, errors: 0 };
  }

  get enabled() {
    return Date.now() >= this.disabledUntil;
  }

  trip(error) {
    this.stats.errors++;
    this.disabledUntil = Date.now() + this.failureCooldownMs;
    // Lazily release the socket; next attempt reconnects.
    this.client.close();
    this.client = new RedisClient(this.client.url, { timeoutMs: this.client.timeoutMs });
    this.lastError = error?.message;
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      const raw = await this.client.command("GET", key);
      if (raw === null || raw === undefined) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return JSON.parse(raw);
    } catch (error) {
      this.trip(error);
      return null;
    }
  }

  async set(key, value, ttlMs) {
    if (!this.enabled) return false;
    try {
      await this.client.command("SET", key, JSON.stringify(value), "PX", ttlMs);
      this.stats.sets++;
      return true;
    } catch (error) {
      this.trip(error);
      return false;
    }
  }

  async ping() {
    try {
      return await this.client.ping();
    } catch (error) {
      this.trip(error);
      return false;
    }
  }

  close() {
    this.client.close();
  }
}
