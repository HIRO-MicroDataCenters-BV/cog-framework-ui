/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DEX Authentication Utility Tests
 *
 * Tests for the core DEX authentication flow including:
 * - Session cookie retrieval
 * - OAuth redirect handling
 * - Cookie management
 * - Session validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDexSessionCookie,
  validateDexSession,
  getCookieExpiration,
} from '../dex-auth';

// Mock fetch globally
global.fetch = vi.fn();

describe('DEX Authentication Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDexSessionCookie', () => {
    it('should successfully retrieve session cookie with valid credentials', async () => {
      // Mock the OAuth flow responses
      const mockResponses = [
        // Initial request - 403 redirect
        {
          status: 403,
          headers: new Headers({
            location: '/oauth2/start?rd=/',
            'set-cookie': 'initial_cookie=value',
          }),
          url: 'https://test.example.com',
        },
        // OAuth start - redirect to auth
        {
          status: 302,
          headers: new Headers({
            location: '/dex/auth',
            'set-cookie': 'oauth_cookie=value',
          }),
          url: 'https://test.example.com/oauth2/start',
        },
        // Auth endpoint - redirect to login
        {
          status: 302,
          headers: new Headers({
            location: '/dex/auth/local/login',
            'set-cookie': 'auth_cookie=value',
          }),
          url: 'https://test.example.com/dex/auth',
        },
        // Login page
        {
          status: 200,
          headers: new Headers(),
          url: 'https://test.example.com/dex/auth/local/login',
        },
        // Login POST - redirect to callback
        {
          status: 302,
          headers: new Headers({
            location: '/authservice/oidc/callback?code=test',
            'set-cookie':
              'authservice_session=test_session_token; expires=Wed, 17 Dec 2025 19:00:00 GMT',
          }),
          url: 'https://test.example.com/dex/auth/local/login',
        },
        // Callback - final redirect
        {
          status: 200,
          headers: new Headers(),
          url: 'https://test.example.com/',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        const response = mockResponses[callCount++];
        return Promise.resolve({
          ...response,
          ok: response.status >= 200 && response.status < 300,
          headers: {
            get: (name: string) => response.headers.get(name),
            getSetCookie: () => {
              const setCookie = response.headers.get('set-cookie');
              return setCookie ? [setCookie] : [];
            },
          },
        });
      });

      const result = await getDexSessionCookie({
        host: 'https://test.example.com',
        username: 'test@example.com',
        password: 'password123',
        authType: 'local',
        skipTlsVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.cookie).toContain('authservice_session=test_session_token');
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle login failure when no redirect occurs', async () => {
      // Mock failed login (no redirect)
      (global.fetch as any).mockResolvedValue({
        status: 200,
        ok: true,
        url: 'https://test.example.com/dex/auth/local/login',
        headers: {
          get: () => null,
          getSetCookie: () => [],
        },
      });

      const result = await getDexSessionCookie({
        host: 'https://test.example.com',
        username: 'test@example.com',
        password: 'wrong_password',
        authType: 'local',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('no redirect');
    });

    it('should handle missing session cookie', async () => {
      const mockResponses = [
        {
          status: 302,
          headers: new Headers({ location: '/oauth2/start' }),
          url: 'https://test.example.com',
        },
        {
          status: 302,
          headers: new Headers({ location: '/callback' }),
          url: 'https://test.example.com/oauth2/start',
        },
        {
          status: 200,
          headers: new Headers(), // No session cookie
          url: 'https://test.example.com/callback',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        const response =
          mockResponses[callCount++] || mockResponses[mockResponses.length - 1];
        return Promise.resolve({
          ...response,
          ok: response.status >= 200 && response.status < 300,
          headers: {
            get: (name: string) => response.headers.get(name),
            getSetCookie: () => [],
          },
        });
      });

      const result = await getDexSessionCookie({
        host: 'https://test.example.com',
        username: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Failed to obtain authservice_session cookie',
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await getDexSessionCookie({
        host: 'https://test.example.com',
        username: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle approval flow', async () => {
      const mockResponses = [
        {
          status: 302,
          headers: new Headers({ location: '/dex/auth/local/login' }),
          url: 'https://test.example.com',
        },
        {
          status: 200,
          headers: new Headers(),
          url: 'https://test.example.com/dex/auth/local/login',
        },
        {
          status: 302,
          headers: new Headers({ location: '/approval' }),
          url: 'https://test.example.com/dex/auth/local/login',
        },
        {
          status: 200,
          headers: new Headers(),
          url: 'https://test.example.com/approval',
        },
        {
          status: 302,
          headers: new Headers({
            location: '/callback',
            'set-cookie': 'authservice_session=approved_session',
          }),
          url: 'https://test.example.com/approval',
        },
        {
          status: 200,
          headers: new Headers(),
          url: 'https://test.example.com/callback',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        const response = mockResponses[callCount++];
        return Promise.resolve({
          ...response,
          ok: response.status >= 200 && response.status < 300,
          headers: {
            get: (name: string) => response.headers.get(name),
            getSetCookie: () => {
              const setCookie = response.headers.get('set-cookie');
              return setCookie ? [setCookie] : [];
            },
          },
        });
      });

      const result = await getDexSessionCookie({
        host: 'https://test.example.com',
        username: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.cookie).toContain('authservice_session=approved_session');
    });
  });

  describe('validateDexSession', () => {
    it('should return true for valid session', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const isValid = await validateDexSession(
        'authservice_session=valid_token',
        'https://test.example.com',
      );

      expect(isValid).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.example.com/pipeline/apis/v2beta1/healthz',
        expect.objectContaining({
          headers: expect.objectContaining({
            Cookie: 'authservice_session=valid_token',
          }),
        }),
      );
    });

    it('should return false for invalid session', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const isValid = await validateDexSession(
        'authservice_session=invalid_token',
        'https://test.example.com',
      );

      expect(isValid).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const isValid = await validateDexSession(
        'authservice_session=token',
        'https://test.example.com',
      );

      expect(isValid).toBe(false);
    });
  });

  describe('getCookieExpiration', () => {
    it('should extract expiration from cookie string', () => {
      const cookie =
        'authservice_session=token; expires=Wed, 17 Dec 2025 19:00:00 GMT; path=/';
      const expiration = getCookieExpiration(cookie);

      expect(expiration).toBeDefined();
      expect(expiration).toBeGreaterThan(Date.now());
    });

    it('should return undefined for cookie without expiration', () => {
      const cookie = 'authservice_session=token; path=/';
      const expiration = getCookieExpiration(cookie);

      expect(expiration).toBeUndefined();
    });

    it('should handle invalid date format', () => {
      const cookie = 'authservice_session=token; expires=invalid-date; path=/';
      const expiration = getCookieExpiration(cookie);

      expect(expiration).toBeDefined();
      expect(isNaN(expiration as number)).toBe(true);
    });
  });
});
