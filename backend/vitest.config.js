import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'development' },
    globals: true,
    // Multe fișiere partajează același utilizator de test din Postgres — rulare paralelă cauzează race condition
    fileParallelism: false,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/__tests__/**', 'src/index.js', 'src/db.js', 'src/utils/logger.js'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
