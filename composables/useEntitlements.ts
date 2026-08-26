import type {
  EntitlementsData,
  EntitlementsResponse,
  EntitlementTier,
} from '~/types/api.types';

/**
 * Tier ladder used for access checks — a tier grants everything the tiers
 * below it grant. Unknown tiers rank below `free`, so they are denied.
 */
const TIER_RANK: Record<EntitlementTier, number> = {
  free: 0,
  enterprise: 1,
  admin: 2,
};

interface EntitlementsState {
  data: EntitlementsData | null;
  loading: boolean;
  /** True once a fetch has settled (successfully or not) */
  loaded: boolean;
  error: string | null;
}

/**
 * Shared in-flight request so concurrent callers (route middleware, sidebar,
 * pages) trigger a single `/entitlements` call instead of one each.
 */
let inflight: Promise<void> | null = null;

/** Aborts the in-flight request when entitlements are cleared (logout). */
let inflightController: AbortController | null = null;

/**
 * Bumped by {@link useEntitlements.clearEntitlements}. A request captures the
 * value at start and discards its result if it no longer matches, so a response
 * that lands after logout cannot repopulate state for the logged-out user.
 */
let generation = 0;

/**
 * Composable for the current user's entitlements
 *
 * Fetches `/entitlements` and exposes the subscription tier and granted
 * permissions so features can be gated in the UI (e.g. the Dashboard is
 * admin-only).
 *
 * Note: this deliberately does not go through {@link useApi}. The entitlements
 * guard runs inside route middleware, where there is no component setup context
 * and `useApi()` (which builds a toaster via `useI18n()`) would throw. The
 * request is therefore issued directly, mirroring the auth headers used by the
 * API client.
 */
export const useEntitlements = () => {
  const state = useState<EntitlementsState>('entitlements', () => ({
    data: null,
    loading: false,
    loaded: false,
    error: null,
  }));

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const mockEnabled = config.public.mockEnabled;
  const token = useLocalStorage('access_token', null);

  /**
   * Mock-mode only: lets the tier be switched at runtime for manual testing,
   * via `?tier=free` on any URL. The choice is persisted, so it survives the
   * redirect the admin guard performs; `?tier=` clears it back to the fixture.
   *
   * @param fallback - Tier from the fixture, used when no override is set
   */
  const resolveMockTier = (fallback: string): string => {
    const override = useLocalStorage('mock_tier', '');
    if (import.meta.client) {
      const fromQuery = new URLSearchParams(window.location.search).get('tier');
      if (fromQuery !== null) override.value = fromQuery;
    }
    return override.value || fallback;
  };

  /**
   * Issues the entitlements request, or resolves the mock fixture when mock
   * mode is enabled.
   */
  const requestEntitlements = async (
    signal: AbortSignal,
  ): Promise<EntitlementsResponse> => {
    if (mockEnabled) {
      const json = await import('~/mocks/get.entitlements.json');
      const fixture = (json.default ?? json) as unknown as EntitlementsResponse;
      const tier = resolveMockTier(fixture.data.tier);
      return {
        ...fixture,
        data: { ...fixture.data, tier, policy_role: `${tier}_tier` },
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    const res = await fetch(`${baseUrl}/entitlements`, { headers, signal });
    if (!res.ok) {
      throw new Error(`Entitlements request failed with status ${res.status}`);
    }
    return (await res.json()) as EntitlementsResponse;
  };

  /**
   * Fetches entitlements once and caches them for the session.
   *
   * Only a successful response is cached. After a failed or malformed one
   * `data` stays null, so the next caller retries — a transient network error
   * must not deny gated routes for the rest of the session.
   *
   * @param force - Refetch even when entitlements are already cached
   */
  const fetchEntitlements = async (force: boolean = false): Promise<void> => {
    if (state.value.data && !force) return;
    if (inflight) return inflight;

    // Captured so a response arriving after clearEntitlements() is discarded.
    const startedAt = generation;
    const controller = new AbortController();
    inflightController = controller;

    state.value.loading = true;
    state.value.error = null;

    inflight = (async () => {
      try {
        const response = await requestEntitlements(controller.signal);
        if (startedAt !== generation) return;
        if (response?.data?.tier) {
          state.value.data = response.data;
        } else {
          state.value.data = null;
          state.value.error = 'Entitlements not found in response';
        }
      } catch (error) {
        if (startedAt !== generation) return;
        state.value.data = null;
        state.value.error =
          error instanceof Error
            ? error.message
            : 'Failed to fetch entitlements';
        console.error('Failed to fetch entitlements:', error);
      } finally {
        // A newer generation owns the state (and already reset these), so a
        // superseded request must not touch it on the way out.
        if (startedAt === generation) {
          state.value.loading = false;
          state.value.loaded = true;
          inflight = null;
          inflightController = null;
        }
      }
    })();

    return inflight;
  };

  const tier = computed(() => state.value.data?.tier ?? null);
  const permissions = computed(() => state.value.data?.permissions ?? []);

  /**
   * Rank of the resolved tier. An unresolved or unrecognized tier falls back to
   * the `free` baseline — every user gets at least free access, so a slow or
   * failed entitlements call never hides the standard navigation. Restricted
   * tiers still fail closed, because nothing outranks `free` until the real
   * tier arrives.
   */
  const tierRank = computed(() => {
    const key = (tier.value ?? '').toLowerCase() as EntitlementTier;
    return TIER_RANK[key] ?? TIER_RANK.free;
  });

  /** Admin tier — currently the only tier that may see the Dashboard */
  const isAdmin = computed(() => tierRank.value >= TIER_RANK.admin);

  /**
   * Checks whether the resolved tier is at least `minTier`.
   * While entitlements are unresolved only the `free` baseline is granted, so
   * gates above free fail closed.
   *
   * @param minTier - Lowest tier that grants access
   */
  const meetsTier = (minTier: EntitlementTier): boolean =>
    tierRank.value >= TIER_RANK[minTier];

  /**
   * Checks a single permission, e.g. `model:serve`
   */
  const hasPermission = (permission: string): boolean =>
    permissions.value.includes(permission);

  /**
   * Clears cached entitlements (e.g. on logout)
   */
  const clearEntitlements = (): void => {
    // Invalidate any in-flight request first: abort the network call, drop the
    // shared promise so the next caller starts fresh, and bump the generation
    // so a response already in transit cannot write back into state.
    generation += 1;
    inflightController?.abort();
    inflightController = null;
    inflight = null;

    state.value.data = null;
    state.value.error = null;
    state.value.loaded = false;
    state.value.loading = false;
  };

  return {
    // State
    entitlements: computed(() => state.value.data),
    tier,
    permissions,
    subscription: computed(() => state.value.data?.subscription ?? null),
    isAdmin,
    loading: computed(() => state.value.loading),
    loaded: computed(() => state.value.loaded),
    error: computed(() => state.value.error),

    // Methods
    fetchEntitlements,
    meetsTier,
    hasPermission,
    clearEntitlements,
  };
};
