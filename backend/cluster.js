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
  const workerCount = configuredWorkers > 0 
    ? configuredWorkers 
    : Math.max(2, Math.min(numCPUs, 8));

  console.log(`[Cluster Primary ${process.pid}] System has ${numCPUs} CPU cores.`);
  console.log(`[Cluster Primary ${process.pid}] Spawning ${workerCount} worker processes...`);

  const workers = new Map();

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork();
    workers.set(worker.id, worker);
  }

  // Self-healing: if a worker dies unexpectedly, spawn a replacement
  cluster.on("exit", (worker, code, signal) => {
    console.warn(`[Cluster Primary] Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}).`);
    workers.delete(worker.id);

    if (!process.isExiting) {
      console.log(`[Cluster Primary] Spawning replacement worker...`);
      const newWorker = cluster.fork();
      workers.set(newWorker.id, newWorker);
    }
  });

  // Coordinated graceful shutdown
  const shutdown = (signal) => {
    if (process.isExiting) return;
    process.isExiting = true;
    console.log(`\n[Cluster Primary] Received ${signal}. Gracefully stopping all workers...`);

    for (const [id, worker] of workers) {
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
  // Worker process: boots Express application
  import("./server.js").catch((err) => {
    console.error(`[Worker ${process.pid}] Failed to boot:`, err);
    process.exit(1);
  });
}
