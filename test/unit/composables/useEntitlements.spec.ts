import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { EntitlementsData } from '~/types/api.types';

const adminPayload: EntitlementsData = {
  user_id: 'admin@hiro.com',
  tier: 'admin',
  policy_role: 'admin_tier',
  permissions: [
    'dataset:create',
    'dataset:read',
    'model:read',
    'model:serve',
    'pipeline:run',
  ],
  enforced: true,
  subscription: {
    plan: 'admin',
    start_date: '2026-08-25T23:09:27.836086',
    end_date: null,
  },
};

const enterprisePayload: EntitlementsData = {
  user_id: 'enterprise@hiro.com',
  tier: 'enterprise',
  policy_role: 'enterprise_tier',
  permissions: ['dataset:create', 'model:read', 'model:serve', 'pipeline:run'],
  enforced: true,
  subscription: {
    plan: 'enterprise',
    start_date: '2026-08-25T23:09:27.836086',
    end_date: null,
  },
};

const freePayload: EntitlementsData = {
  user_id: 'test5@hiro.com',
  tier: 'free',
  policy_role: 'free_tier',
  permissions: ['dataset:read', 'model:read', 'model:upload', 'pipeline:read'],
  enforced: true,
  subscription: null,
};

// Nuxt auto-import shims: a per-test `useState` store and a stubbed fetch.
const stateStore = new Map<string, ReturnType<typeof ref>>();
const fetchMock = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useState = (key: string, init: () => unknown) => {
  if (!stateStore.has(key)) stateStore.set(key, ref(init()));
  return stateStore.get(key);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useRuntimeConfig = () => ({
  public: { apiBase: '/apidev', mockEnabled: false },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useLocalStorage = () => ref('test-token');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetchMock;

const { useEntitlements } = await import('~/composables/useEntitlements');

const respond = (data: EntitlementsData) => ({
  ok: true,
  status: 200,
  json: async () => ({
    status_code: 200,
    message: 'Entitlements resolved.',
    data,
  }),
});

describe('useEntitlements', () => {
  beforeEach(() => {
    stateStore.clear();
    fetchMock.mockReset();
  });

  it('marks an admin user as entitled to admin-only features', async () => {
    fetchMock.mockResolvedValue(respond(adminPayload));

    const {
      fetchEntitlements,
      isAdmin,
      meetsTier,
      tier,
      hasPermission,
      loaded,
    } = useEntitlements();
    await fetchEntitlements();

    expect(loaded.value).toBe(true);
    expect(tier.value).toBe('admin');
    expect(isAdmin.value).toBe(true);
    expect(meetsTier('enterprise')).toBe(true);
    expect(meetsTier('free')).toBe(true);
    expect(hasPermission('model:serve')).toBe(true);
  });

  it('denies admin-only features to an enterprise user', async () => {
    fetchMock.mockResolvedValue(respond(enterprisePayload));

    const { fetchEntitlements, isAdmin, meetsTier, tier } = useEntitlements();
    await fetchEntitlements();

    expect(tier.value).toBe('enterprise');
    expect(isAdmin.value).toBe(false);
    expect(meetsTier('admin')).toBe(false);
    expect(meetsTier('enterprise')).toBe(true);
  });

  it('denies admin-only features to a free user', async () => {
    fetchMock.mockResolvedValue(respond(freePayload));

    const { fetchEntitlements, isAdmin, meetsTier, tier, hasPermission } =
      useEntitlements();
    await fetchEntitlements();

    expect(tier.value).toBe('free');
    expect(isAdmin.value).toBe(false);
    expect(meetsTier('admin')).toBe(false);
    expect(meetsTier('enterprise')).toBe(false);
    expect(meetsTier('free')).toBe(true);
    expect(hasPermission('model:serve')).toBe(false);
    expect(hasPermission('model:read')).toBe(true);
  });

  it('falls back to the free baseline when the tier is unknown', async () => {
    fetchMock.mockResolvedValue(
      respond({ ...freePayload, tier: 'something-new' }),
    );

    const { fetchEntitlements, isAdmin, meetsTier } = useEntitlements();
    await fetchEntitlements();

    expect(isAdmin.value).toBe(false);
    expect(meetsTier('enterprise')).toBe(false);
    expect(meetsTier('free')).toBe(true);
  });

  it('grants the free baseline before entitlements resolve', () => {
    const { meetsTier, isAdmin, loaded } = useEntitlements();

    // Nothing fetched yet — unrestricted navigation must still render.
    expect(loaded.value).toBe(false);
    expect(meetsTier('free')).toBe(true);
    expect(meetsTier('admin')).toBe(false);
    expect(isAdmin.value).toBe(false);
  });

  it('fetches once and reuses the cached entitlements', async () => {
    fetchMock.mockResolvedValue(respond(adminPayload));

    const { fetchEntitlements } = useEntitlements();
    await Promise.all([fetchEntitlements(), fetchEntitlements()]);
    await fetchEntitlements();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('calls the entitlements endpoint with the auth header', async () => {
    fetchMock.mockResolvedValue(respond(adminPayload));

    const { fetchEntitlements } = useEntitlements();
    await fetchEntitlements();

    expect(fetchMock).toHaveBeenCalledWith('/apidev/entitlements', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('refetches when forced', async () => {
    fetchMock.mockResolvedValue(respond(freePayload));

    const { fetchEntitlements } = useEntitlements();
    await fetchEntitlements();
    await fetchEntitlements(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to no entitlements when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { fetchEntitlements, isAdmin, meetsTier, loaded, error } =
      useEntitlements();
    await fetchEntitlements();

    expect(loaded.value).toBe(true);
    expect(isAdmin.value).toBe(false);
    // A failed request must not blank out unrestricted navigation.
    expect(meetsTier('free')).toBe(true);
    expect(error.value).toBe('boom');

    consoleError.mockRestore();
  });

  it('clears cached entitlements on logout', async () => {
    fetchMock.mockResolvedValue(respond(adminPayload));

    const { fetchEntitlements, clearEntitlements, isAdmin, loaded } =
      useEntitlements();
    await fetchEntitlements();
    clearEntitlements();

    expect(loaded.value).toBe(false);
    expect(isAdmin.value).toBe(false);
  });
});
