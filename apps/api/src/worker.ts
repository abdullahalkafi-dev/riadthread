import { connectDb, disconnectDb } from './config/db';
import { logger } from './config/logger';
import './jobs';
import { closeQueues, startWorkers } from './lib/queue';
import { closeRedis } from './lib/redis';
import { storage } from './lib/storage';

/**
 * Background worker: same code and image as the API, different entry point.
 * It runs the queues (media processing, e-mail) and shuts down cleanly.
 */
async function main() {
  await connectDb();
  await storage.ensureBuckets().catch((err) => logger.warn({ err }, 'Storage is not reachable yet'));
  const workers = startWorkers({ media: 2, email: 4 });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, stopping workers`);
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
