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
 * Re-read on every page entry and refreshed on demand (after a serving,
 * training job or fine-tune is created or deleted, so the bars move).
 * `quota` stays `null` for users without a Kubeflow Profile, and the card
 * hides itself when no quota is set, so callers can mount it
 * unconditionally.
 */
export const useQuota = () => {
  const state = useState<QuotaState>('quota', () => ({
    data: null,
    loading: false,
    loaded: false,
  }));
  const { getMyQuota } = useApi();

  const run = async (): Promise<void> => {
    state.value.loading = true;
    try {
      const response = (await getMyQuota()) as {
        data?: QuotaStatus;
      } | null;
      // A failed read keeps whatever was shown before rather than hiding
      // the card; the next page entry or refresh tries again.
      if (response?.data) state.value.data = response.data;
    } catch {
      /* keep the previous value */
    } finally {
      state.value.loading = false;
      state.value.loaded = true;
    }
  };

  /**
   * Read the quota. Called on every page entry so usage is never a stale
   * session-long snapshot; concurrent callers share one request. With
   * ``force`` a new request is queued behind any in-flight one, so a
   * refresh issued while an older read is still returning cannot be
   * answered by that older snapshot.
   */
  const fetchMyQuota = async (force = false): Promise<void> => {
    if (inflight && !force) return inflight;
    const previous = inflight ?? Promise.resolve();
    const next: Promise<void> = previous.then(run).finally(() => {
      if (inflight === next) inflight = null;
    });
    inflight = next;
    return next;
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
