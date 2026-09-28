import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import process from "node:process";
import apiRoutes from "./routes/apiRoutes.js";
import cacheManager from "./utils/cacheManager.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;

// Enable reverse proxy trust (Nginx, Cloudflare, AWS ALB, K8s Ingress)
app.set("trust proxy", true);

// Middleware
app.use(cors());
app.use(compression()); // Compress responses
app.use(express.json({ limit: "10kb" })); // Limit payload size
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Security headers
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Routes
app.use("/api", apiRoutes);

// Liveness Probe (Kubernetes / Docker)
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
    timestamp: new Date().toISOString() 
  });
});

// Readiness Probe (Ensures worker is ready to handle traffic)
app.get("/ready", (req, res) => {
  res.json({
    ready: true,
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
});

// Real-time Cache & Performance Telemetry
app.get("/api/stats", (req, res) => {
  res.json({
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    cache: cacheManager.getStats(),
    memory: process.memoryUsage(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`Smart Reply backend running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});