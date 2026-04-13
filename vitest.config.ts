import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [['**/*.ui.spec.ts', 'happy-dom']],
    setupFiles: ['./test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.claude/**',
      'test/e2e/**',
      '**/*.e2e.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '.nuxt/',
        '.output/',
      ],
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
