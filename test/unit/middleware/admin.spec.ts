import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchEntitlementsMock = vi.fn();
const navigateToMock = vi.fn((to: string) => ({ redirectedTo: to }));
const isAdmin = { value: false };

// Nuxt auto-import shims.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).defineNuxtRouteMiddleware = (fn: unknown) => fn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useEntitlements = () => ({
  fetchEntitlements: fetchEntitlementsMock,
  isAdmin,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).navigateTo = navigateToMock;

const adminMiddleware = (await import('~/middleware/admin'))
  .default as () => Promise<unknown>;

describe('admin route middleware', () => {
  beforeEach(() => {
    fetchEntitlementsMock.mockReset();
    navigateToMock.mockClear();
    isAdmin.value = false;
  });

  it('lets an admin user through', async () => {
    fetchEntitlementsMock.mockImplementation(async () => {
      isAdmin.value = true;
    });

    const result = await adminMiddleware();

    expect(fetchEntitlementsMock).toHaveBeenCalled();
    expect(navigateToMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('redirects a non-admin user to datasets before the page loads', async () => {
    fetchEntitlementsMock.mockImplementation(async () => {
      isAdmin.value = false;
    });

    await adminMiddleware();

    expect(navigateToMock).toHaveBeenCalledWith('/datasets', {
      replace: true,
    });
  });

  it('fails closed when entitlements cannot be resolved', async () => {
    fetchEntitlementsMock.mockResolvedValue(undefined);

    await adminMiddleware();

    expect(navigateToMock).toHaveBeenCalledWith('/datasets', {
      replace: true,
    });
  });
});
