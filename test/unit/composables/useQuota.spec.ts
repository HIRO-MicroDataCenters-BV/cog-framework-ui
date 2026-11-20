/**
 * useQuota: concurrent readers share one request, a forced refresh is
 * queued behind an in-flight read instead of being answered by it, a
 * failed read keeps the previous value, and every call re-reads (no
 * session-long cache).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed, ref } from 'vue';

const getMyQuota = vi.fn();
const store = new Map<string, unknown>();

beforeEach(() => {
  store.clear();
  getMyQuota.mockReset();
  (globalThis as Record<string, unknown>).useState = (
    key: string,
    init: () => unknown,
  ) => {
    if (!store.has(key)) store.set(key, ref(init()));
    return store.get(key);
  };
  (globalThis as Record<string, unknown>).useApi = () => ({ getMyQuota });
  (globalThis as Record<string, unknown>).computed = computed;
  vi.resetModules();
});

const load = async () => (await import('~/composables/useQuota')).useQuota();

const status = (cpuUsed: string) => ({
  data: {
    user_id: 'u',
    namespace: 'ns',
    enabled: true,
    synced: true,
    resources: [
      {
        resource: 'cpu',
        hard: '4',
        used: cpuUsed,
        hard_value: 4,
        used_value: 1,
        ratio: 0.25,
      },
    ],
    limit_range: null,
    quota_name: 'kf-resource-quota',
  },
});

describe('useQuota', () => {
  it('shares one request between concurrent readers and re-reads later', async () => {
    getMyQuota.mockResolvedValue(status('1'));
    const q = await load();
    await Promise.all([q.fetchMyQuota(), q.fetchMyQuota()]);
    expect(getMyQuota).toHaveBeenCalledTimes(1);
    expect(q.quota.value?.resources[0].used).toBe('1');
    // A later page entry revalidates instead of serving the snapshot.
    await q.fetchMyQuota();
    expect(getMyQuota).toHaveBeenCalledTimes(2);
  });

  it('queues a forced refresh behind an in-flight read', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    getMyQuota
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce(status('3'));
    const q = await load();
    const first = q.fetchMyQuota();
    const forced = q.refresh();
    // The read starts on the microtask queue; the forced one waits behind it.
    await new Promise((r) => setTimeout(r, 0));
    expect(getMyQuota).toHaveBeenCalledTimes(1);
    resolveFirst(status('1'));
    await first;
    await forced;
    expect(getMyQuota).toHaveBeenCalledTimes(2);
    expect(q.quota.value?.resources[0].used).toBe('3');
  });

  it('keeps the previous value when a read fails', async () => {
    getMyQuota.mockResolvedValueOnce(status('1')).mockResolvedValueOnce(null);
    const q = await load();
    await q.fetchMyQuota();
    await q.refresh();
    expect(q.quota.value?.resources[0].used).toBe('1');
    expect(q.loaded.value).toBe(true);
  });
});
