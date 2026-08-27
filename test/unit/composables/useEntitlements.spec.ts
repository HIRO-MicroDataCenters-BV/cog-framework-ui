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
// Mutable so the mock-mode tests can flip `mockEnabled` on for a single case.
const runtimeConfig = {
  public: { apiBase: '/apidev', mockEnabled: false },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useRuntimeConfig = () => runtimeConfig;

// Per-key store: `access_token`, `mock_tier` and `mock_permissions` each need
// their own ref, so tests can set one without disturbing the others.
const localStorageStore = new Map<string, ReturnType<typeof ref>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).useLocalStorage = (key: string, initial: unknown) => {
  if (!localStorageStore.has(key)) {
    localStorageStore.set(
      key,
      ref(key === 'access_token' ? 'test-token' : initial),
    );
  }
  return localStorageStore.get(key);
};
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
    localStorageStore.clear();
    fetchMock.mockReset();
    runtimeConfig.public.mockEnabled = false;
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
      signal: expect.any(AbortSignal),
    });
  });

  it('retries after a failed fetch instead of caching the failure', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const { fetchEntitlements, isAdmin, error } = useEntitlements();
    await fetchEntitlements();

    expect(isAdmin.value).toBe(false);
    expect(error.value).toBe('network down');

    // A transient failure must not deny gated routes for the whole session.
    fetchMock.mockResolvedValue(respond(adminPayload));
    await fetchEntitlements();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isAdmin.value).toBe(true);
    expect(error.value).toBeNull();

    consoleError.mockRestore();
  });

  it('retries when the response carries no tier', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status_code: 200, message: 'empty', data: null }),
    });

    const { fetchEntitlements, isAdmin } = useEntitlements();
    await fetchEntitlements();

    expect(isAdmin.value).toBe(false);

    fetchMock.mockResolvedValue(respond(adminPayload));
    await fetchEntitlements();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isAdmin.value).toBe(true);
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

  it('discards a response that lands after entitlements are cleared', async () => {
    let settleFetch: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        settleFetch = resolve;
      }),
    );

    const { fetchEntitlements, clearEntitlements, isAdmin, loading, loaded } =
      useEntitlements();
    const pending = fetchEntitlements();

    expect(loading.value).toBe(true);

    // Logout while the request is still in flight.
    clearEntitlements();
    expect(loading.value).toBe(false);
    expect(loaded.value).toBe(false);

    settleFetch(respond(adminPayload));
    await pending;

    // The late response must not repopulate state for the logged-out user.
    expect(isAdmin.value).toBe(false);
    expect(loading.value).toBe(false);
    expect(loaded.value).toBe(false);
  });

  it('starts a fresh request after being cleared mid-flight', async () => {
    let settleFetch: (value: unknown) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        settleFetch = resolve;
      }),
    );

    const { fetchEntitlements, clearEntitlements, isAdmin } = useEntitlements();
    const pending = fetchEntitlements();
    clearEntitlements();
    settleFetch(respond(freePayload));
    await pending;

    // The stale promise must not gate the next fetch.
    fetchMock.mockResolvedValue(respond(adminPayload));
    await fetchEntitlements();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isAdmin.value).toBe(true);
  });

  it('aborts the in-flight request when cleared', async () => {
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) => {
        capturedSignal = init.signal;
        return new Promise(() => {});
      },
    );

    const { fetchEntitlements, clearEntitlements } = useEntitlements();
    fetchEntitlements();

    expect(capturedSignal?.aborted).toBe(false);
    clearEntitlements();
    expect(capturedSignal?.aborted).toBe(true);
  });

  describe('mock mode', () => {
    // The `?perms=` / `?tier=` query parsing sits behind `import.meta.client`
    // and needs a browser; these cover the persisted-override logic underneath,
    // which is where the parsing and the `none` special case live.
    const enableMock = () => {
      runtimeConfig.public.mockEnabled = true;
    };

    const setOverride = (key: string, value: string) => {
      localStorageStore.set(key, ref(value));
    };

    it('serves the fixture permissions when no override is set', async () => {
      enableMock();

      const { fetchEntitlements, permissions, tier } = useEntitlements();
      await fetchEntitlements();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(tier.value).toBe('admin');
      expect(permissions.value).toContain('dataset:create');
    });

    it('replaces permissions from the `perms` override', async () => {
      enableMock();
      setOverride('mock_permissions', 'dataset:read,model:read');

      const { fetchEntitlements, permissions, hasPermission } =
        useEntitlements();
      await fetchEntitlements();

      expect(permissions.value).toEqual(['dataset:read', 'model:read']);
      expect(hasPermission('dataset:read')).toBe(true);
      expect(hasPermission('dataset:create')).toBe(false);
    });

    it('trims whitespace and drops empty entries in the override', async () => {
      enableMock();
      setOverride('mock_permissions', ' dataset:read , , model:read ');

      const { fetchEntitlements, permissions } = useEntitlements();
      await fetchEntitlements();

      expect(permissions.value).toEqual(['dataset:read', 'model:read']);
    });

    it('grants an empty permission set for `none`', async () => {
      enableMock();
      setOverride('mock_permissions', 'none');

      const { fetchEntitlements, permissions, hasPermission } =
        useEntitlements();
      await fetchEntitlements();

      expect(permissions.value).toEqual([]);
      expect(hasPermission('dataset:read')).toBe(false);
    });

    it('keeps the permission and tier overrides independent', async () => {
      enableMock();
      setOverride('mock_permissions', 'none');
      setOverride('mock_tier', 'free');

      const { fetchEntitlements, permissions, tier, isAdmin } =
        useEntitlements();
      await fetchEntitlements();

      // Clearing permissions must not disturb the tier, and vice versa.
      expect(tier.value).toBe('free');
      expect(isAdmin.value).toBe(false);
      expect(permissions.value).toEqual([]);
    });
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
