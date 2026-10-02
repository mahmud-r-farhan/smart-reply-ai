import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";

/**
 * Production Multi-Core Cluster Orchestrator
 * Scales Express across all CPU cores on a single host.
 * Provides self-healing worker supervision and graceful shutdown.
 */
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const configuredWorkers = parseInt(process.env.WORKERS, 10);
  const workerCount =
    configuredWorkers > 0 ? configuredWorkers : Math.max(2, Math.min(numCPUs, 8));

  console.log(`[Cluster Primary ${process.pid}] System has ${numCPUs} CPU cores.`);
  console.log(`[Cluster Primary ${process.pid}] Spawning ${workerCount} worker processes...`);

  const workers = new Map();
  const recentExits = [];
  let isExiting = false;

  const spawnWorker = () => {
    const worker = cluster.fork();
    workers.set(worker.id, worker);
    return worker;
  };

  for (let i = 0; i < workerCount; i++) {
    spawnWorker();
  }

  // Self-healing: if a worker dies unexpectedly, spawn a replacement.
  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `[Cluster Primary] Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}).`
    );
    workers.delete(worker.id);

    if (isExiting) return;

    // Crash-loop protection: give up if workers keep dying immediately.
    const now = Date.now();
    recentExits.push(now);
    while (recentExits.length > 0 && now - recentExits[0] > 30000) recentExits.shift();
    if (recentExits.length > workerCount * 5) {
      console.error("[Cluster Primary] Too many worker crashes in 30s. Shutting down.");
      process.exit(1);
    }

    console.log("[Cluster Primary] Spawning replacement worker...");
    spawnWorker();
  });

  // Coordinated graceful shutdown
  const shutdown = (signal) => {
    if (isExiting) return;
    isExiting = true;
    console.log(`\n[Cluster Primary] Received ${signal}. Gracefully stopping all workers...`);

    for (const [, worker] of workers) {
      worker.process.kill(signal);
    }

    // Force exit after 10 seconds if workers fail to close
    setTimeout(() => {
      console.error("[Cluster Primary] Force terminating cluster due to shutdown timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
} else {
  // Worker process: boots the Express application
  import("./server.js")
    .then(({ startServer, attachGracefulShutdown }) =>
      startServer().then(attachGracefulShutdown)
    )
    .catch((err) => {
      console.error(`[Worker ${process.pid}] Failed to boot:`, err);
      process.exit(1);
    });
}
