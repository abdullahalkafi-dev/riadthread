import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connectDb, disconnectDb } from './config/db';
import { logger } from './config/logger';
import { startMaintenance } from './jobs';
import { closeQueues, startWorkers } from './lib/queue';
import { closeRedis, queueRedis } from './lib/redis';
import { storage } from './lib/storage';

/** Must match docker/healthcheck.cjs. */
const HEARTBEAT_FILE = join(tmpdir(), 'riad-worker-heartbeat');

/**
 * The worker has no HTTP port, so the container healthcheck reads this file
 * instead. It is touched only while the database and the queue are connected,
 * so a worker that has lost either one turns unhealthy.
 */
function startHeartbeat(everyMs = 15_000): () => void {
  const beat = () => {
    if (mongoose.connection.readyState === 1 && queueRedis?.status === 'ready') {
      writeFile(HEARTBEAT_FILE, String(Date.now())).catch(() => undefined);
    }
  };
  beat();
  const timer = setInterval(beat, everyMs);
  timer.unref();
  return () => clearInterval(timer);
}

/**
 * Background worker: same code and image as the API, different entry point.
 * It runs the queues (media processing, e-mail) and shuts down cleanly.
 */
async function main() {
  await connectDb();
  await storage.ensureBuckets().catch((err) => logger.warn({ err }, 'Storage is not reachable yet'));
  const workers = startWorkers({ media: 2, email: 4 });
  const stopMaintenance = startMaintenance();
  const stopHeartbeat = startHeartbeat();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, stopping workers`);
    stopHeartbeat();
    stopMaintenance();
    await Promise.allSettled(workers.map((w) => w.close()));
    await closeQueues();
    await closeRedis();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start the worker');
  process.exit(1);
});
