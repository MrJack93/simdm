import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configurație Vitest pentru testele frontend SIMDM.
// Mediu jsdom + React Testing Library; setup global în src/__tests__/setup.js.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    css: false,
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/__tests__/**',
      ],
    },
  },
});
