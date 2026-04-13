/**
 * Test Setup
 *
 * Global test setup and utilities
 */

import { vi } from 'vitest';
import { ref } from 'vue';

// Mock environment variables for tests
process.env.NUXT_DEX_HOST = 'https://test.example.com';
process.env.NUXT_DEX_USERNAME = 'test@example.com';
process.env.NUXT_DEX_PASSWORD = 'test_password';
process.env.NUXT_DEX_AUTH_TYPE = 'local';
process.env.NUXT_DEX_SKIP_TLS_VERIFY = 'true';

// Minimal Nuxt auto-import shims for component unit tests.
// These are intentionally lightweight and overridden in specific tests as needed.
globalThis.ref = ref;
globalThis.useI18n = () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params?.name ? `${key}:${String(params.name)}` : key,
});

// Global test utilities
global.testUtils = {
  createMockResponse: (
    status: number,
    headers: Record<string, string> = {},
    body: unknown = {},
  ) => ({
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }),

  createMockCookie: (name: string, value: string, expires?: Date) => {
    let cookie = `${name}=${value}`;
    if (expires) {
      cookie += `; expires=${expires.toUTCString()}`;
    }
    return cookie;
  },
};

// Extend global types
declare global {
  const ref: typeof import('vue').ref;
  const useI18n: () => {
    t: (key: string, params?: Record<string, unknown>) => string;
  };
  var testUtils: {
    createMockResponse: (
      status: number,
      headers?: Record<string, string>,
      body?: unknown,
    ) => unknown;
    createMockCookie: (name: string, value: string, expires?: Date) => string;
  };
}
