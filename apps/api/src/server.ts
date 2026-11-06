import { createApp } from './app';
import { connectDb, disconnectDb } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { seedAdminIfMissing } from './modules/user/user.service';

async function main() {
  await connectDb();
  await seedAdminIfMissing();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Finish in-flight requests before closing connections.
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start the API');
  process.exit(1);
});
