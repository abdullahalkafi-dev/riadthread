import { connectDb, disconnectDb } from '../config/db';
import { logger } from '../config/logger';
import { seedAdminIfMissing } from '../modules/user/user.service';

/** pnpm seed:admin: safe to run repeatedly. */
async function main() {
  await connectDb();
  const result = await seedAdminIfMissing();
  logger.info(`Admin seed: ${result}`);
  await disconnectDb();
}

main().catch((err) => {
  logger.error({ err }, 'Admin seed failed');
  process.exit(1);
});
