import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import process from "node:process";
import { fileURLToPath } from "node:url";
import apiRoutes from "./routes/apiRoutes.js";
import cacheManager from "./utils/cacheManager.js";
import singleflight from "./utils/singleflight.js";

dotenv.config();

const DEFAULT_PORT = 5006;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "64kb";

/** Resolve the `trust proxy` setting safely (never blindly `true`). */
const resolveTrustProxy = () => {
  const raw = process.env.TRUST_PROXY;
  if (!raw) return false;
  if (/^\d+$/.test(raw.trim())) return Number(raw.trim()); // hop count, e.g. 1
  if (/^(true|on|yes)$/i.test(raw.trim())) return 1; // one trusted hop
  return raw; // named list / subnet, e.g. "loopback, 10.0.0.0/8"
};

const resolveCorsOrigin = () => {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
  if (!raw || raw.trim() === "*") return "*";
  const allowed = raw.split(",").map((origin) => origin.trim()).filter(Boolean);
  return (origin, callback) => {
    // Same-origin / server-to-server requests have no Origin header.
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(null, false);
  };
};

export const createApp = () => {
  const app = express();

  // Enable reverse proxy trust (Nginx, Cloudflare, AWS ALB, K8s Ingress)
  app.set("trust proxy", resolveTrustProxy());
  app.disable("x-powered-by");

  // Middleware
  app.use(
    cors({
      origin: resolveCorsOrigin(),
      methods: ["GET", "POST", "OPTIONS"],
      maxAge: 86400,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ limit: JSON_BODY_LIMIT, extended: true }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  });

  // Liveness probe (Kubernetes / Docker)
  app.get("/health", (req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: "ok",
      service: "smart-reply-backend",
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe (ensures the worker is ready to handle traffic)
  app.get("/ready", (req, res) => {
    res.json({ ready: true, pid: process.pid, timestamp: new Date().toISOString() });
  });

  // Real-time cache & performance telemetry
  app.get("/api/stats", (req, res) => {
    res.json({
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      cache: cacheManager.getStats(),
      singleflightInFlight: singleflight.size,
      memory: process.memoryUsage(),
    });
  });

  // Routes (rate limited inside apiRoutes)
  app.use("/api", apiRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    let status = err.status || err.statusCode || 500;
    let message = err.message;

    // Translate body-parser failures into clean client errors.
    if (err.type === "entity.parse.failed") {
      status = 400;
      message = "Invalid JSON payload";
    } else if (err.type === "entity.too.large") {
      status = 413;
      message = "Payload too large";
    }

    if (status >= 500) {
      console.error("Unhandled error:", err);
    } else {
      console.warn(`Request rejected (${status}): ${message}`);
    }

    if (res.headersSent) return next(err);

    const isProduction = process.env.NODE_ENV === "production";
    res.status(status).json({
      error: status >= 500 && isProduction ? "Internal server error" : message || "Request failed",
    });
  });

  return app;
};

/**
 * Start an HTTP server for the app.
 * @returns {Promise<import("node:http").Server>}
 */
export const startServer = (port = process.env.PORT || DEFAULT_PORT) =>
  new Promise((resolve, reject) => {
    const app = createApp();
    let server;
    if (port === 0 || port === "0") {
      server = app.listen(0, "0.0.0.0");
    } else {
      server = app.listen(port, "0.0.0.0", () => {
        console.log(`Smart Reply backend running on http://localhost:${port}`);
      });
    }
    server.on("listening", () => resolve(server));
    server.on("error", reject);

    // Periodically release expired cache entries (bounded, unref'd timer).
    const pruneTimer = setInterval(() => cacheManager.prune(), 5 * 60 * 1000);
    pruneTimer.unref();
    server.on("close", () => clearInterval(pruneTimer));

    // Harden against slow-loris style connection holding.
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  });

/** Attach graceful shutdown handlers to a running server. */
export const attachGracefulShutdown = (server) => {
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, shutting down gracefully`);

    const forceExit = setTimeout(() => {
      console.error("Shutdown timed out, forcing exit");
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(() => {
      console.log("Server closed");
      clearTimeout(forceExit);
      process.exit(0);
    });
    server.closeIdleConnections?.();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

// Boot only when executed directly (`node server.js`); importing this module
// (tests, cluster workers) returns the app factory instead of listening.
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  startServer()
    .then(attachGracefulShutdown)
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}

export default createApp;
