import type { QuotaStatus } from '~/types/api.types';

interface QuotaState {
  data: QuotaStatus | null;
  loading: boolean;
  /** True once a fetch has settled, successfully or not. */
  loaded: boolean;
}

/**
 * Shared in-flight request so the pages that show the quota card do not
 * each issue their own `/quotas/me` call on the same navigation.
 */
let inflight: Promise<void> | null = null;

/**
 * The current user's resource quota and usage.
 *
 * Read once per session and refreshed on demand (after a serving, training
 * job or fine-tune is created, so the bars move). `quota` stays `null` for
 * users without a Kubeflow Profile, and the card hides itself when no quota
 * is set, so callers can mount it unconditionally.
 */
export const useQuota = () => {
  const state = useState<QuotaState>('quota', () => ({
    data: null,
    loading: false,
    loaded: false,
  }));
  const { getMyQuota } = useApi();

  const fetchMyQuota = async (force = false): Promise<void> => {
    if (state.value.loaded && !force) return;
    if (inflight) return inflight;
    state.value.loading = true;
    inflight = (async () => {
      try {
        const response = (await getMyQuota()) as {
          data?: QuotaStatus;
        } | null;
        state.value.data = response?.data ?? null;
      } catch {
        state.value.data = null;
      } finally {
        state.value.loading = false;
        state.value.loaded = true;
        inflight = null;
      }
    })();
    return inflight;
  };

  /** Re-read after something that changes usage was created or deleted. */
  const refresh = () => fetchMyQuota(true);

  return {
    quota: computed(() => state.value.data),
    loading: computed(() => state.value.loading),
    loaded: computed(() => state.value.loaded),
    fetchMyQuota,
    refresh,
  };
};
