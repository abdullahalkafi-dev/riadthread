import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Safe placeholders so config can load without touching real services.
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret-0000',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret-000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused-in-unit-tests',
    },
  },
});
