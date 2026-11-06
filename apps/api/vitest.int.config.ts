import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Integration tests run against the real test database and MinIO from .env.
process.loadEnvFile(resolve(import.meta.dirname, '../../.env'));
// No queue Redis: jobs run inline, so tests do not need a worker process.
// No cache Redis: every read hits the database, so queries can be counted.
process.env.REDIS_QUEUE_URL = '';
process.env.REDIS_CACHE_URL = '';
// Never send real e-mail from tests: messages go to the log transport instead.
process.env.SMTP_URL = '';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.int.test.ts'],
    testTimeout: 90_000,
    hookTimeout: 90_000,
    fileParallelism: false,
  },
});
