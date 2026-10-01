import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { WorkgroupEnvInfo } from '~/types/api.types';

// Nuxt auto-import shims, same approach as useEntitlements.spec.ts.
const stateStore = new Map<string, ReturnType<typeof ref>>();
const fetchMock = vi.fn();

/* eslint-disable @typescript-eslint/no-explicit-any */
(globalThis as any).useState = (key: string, init: () => unknown) => {
  if (!stateStore.has(key)) stateStore.set(key, ref(init()));
  return stateStore.get(key);
};
(globalThis as any).computed = computed;
(globalThis as any).ref = ref;
(globalThis as any).useRuntimeConfig = () => ({
  public: {
    apiBase: 'https://host.test/apidev',
    apiRuns: 'https://host.test/pipeline/apis/v2beta1',
    mockEnabled: false,
  },
});
(globalThis as any).useLocalStorage = (key: string) => ref(`${key}-value`);
(globalThis as any).useApp = () => ({
  setPage: vi.fn(),
  page: ref({}),
});
(globalThis as any).useToaster = () => ({ show: vi.fn() });
(globalThis as any).fetch = fetchMock;
/* eslint-enable @typescript-eslint/no-explicit-any */

const { useApi, resetWorkgroupEnvInfo } = await import('~/composables/api');

const envInfo = (namespaces: WorkgroupEnvInfo['namespaces']) => ({
  ok: true,
  status: 200,
  json: async () =>
    ({
      user: 'test5@hiro.com',
      namespaces,
      isClusterAdmin: false,
    }) satisfies WorkgroupEnvInfo,
});

const runsPage = {
  ok: true,
  status: 200,
  json: async () => ({ runs: [], total_size: 0, next_page_token: '' }),
};

/** URLs passed to fetch, in call order. */
const calledUrls = () => fetchMock.mock.calls.map((c) => String(c[0]));
const runsUrl = () =>
  calledUrls().find((u) => u.includes('/pipeline/apis/v2beta1/runs'));

describe('useApi namespace resolution', () => {
  beforeEach(() => {
    stateStore.clear();
    fetchMock.mockReset();
    resetWorkgroupEnvInfo();
  });

  it("scopes pipeline runs to the signed-in user's namespace, not admin", async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValueOnce(runsPage);

    await useApi().getPipelineRunsListV2();

    expect(calledUrls()[0]).toBe('https://host.test/api/workgroup/env-info');
    expect(runsUrl()).toContain('namespace=test5');
    expect(runsUrl()).not.toContain('namespace=admin');
  });

  it('prefers the owned namespace when the user belongs to several', async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([
          { user: 'u', namespace: 'shared-with-me', role: 'contributor' },
          { user: 'u', namespace: 'test5', role: 'owner' },
        ]),
      )
      .mockResolvedValueOnce(runsPage);

    await useApi().getPipelineRunsListV2();

    expect(runsUrl()).toContain('namespace=test5');
  });

  it('honours an explicitly passed namespace without calling env-info', async () => {
    fetchMock.mockResolvedValueOnce(runsPage);

    await useApi().getPipelineRunsListV2({ namespace: 'explicit-ns' });

    expect(calledUrls()).toHaveLength(1);
    expect(runsUrl()).toContain('namespace=explicit-ns');
  });

  it('reads env-info once and reuses it across calls', async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValue(runsPage);

    const api = useApi();
    await api.getPipelineRunsListV2();
    await api.getPipelineRunsListV2();
    await api.getExperimentsListV2();

    const envCalls = calledUrls().filter((u) => u.includes('env-info'));
    expect(envCalls).toHaveLength(1);
  });

  // A user with no workspace must not silently fall back to someone else's.
  it('makes no pipeline request when the user owns no namespace', async () => {
    fetchMock.mockResolvedValueOnce(envInfo([]));

    const result = await useApi().getPipelineRunsListV2();

    expect(result).toBeNull();
    expect(runsUrl()).toBeUndefined();
  });

  it('makes no pipeline request when env-info itself fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    const result = await useApi().getPipelineRunsListV2();

    expect(result).toBeNull();
    expect(runsUrl()).toBeUndefined();
  });

  it('retries env-info after a failure rather than caching the error', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await useApi().getPipelineRunsListV2();

    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValueOnce(runsPage);
    await useApi().getPipelineRunsListV2();

    expect(runsUrl()).toContain('namespace=test5');
  });

  // --- the other call sites -------------------------------------------------

  it('scopes the experiments list to the resolved namespace', async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ experiments: [], total_size: 0 }),
      });

    await useApi().getExperimentsListV2();

    const url = calledUrls().find((u) => u.includes('/experiments'));
    expect(url).toContain('namespace=test5');
  });

  it("scopes an experiment's runs to the resolved namespace", async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValueOnce(runsPage);

    await useApi().getRunsByExperiment('exp-1');

    expect(runsUrl()).toContain('namespace=test5');
    expect(runsUrl()).toContain('experiment_id=exp-1');
  });

  it('returns no runs for an experiment when the user owns no namespace', async () => {
    fetchMock.mockResolvedValueOnce(envInfo([]));

    const result = await useApi().getRunsByExperiment('exp-1');

    expect(result).toEqual([]);
    expect(runsUrl()).toBeUndefined();
  });

  it('scopes pod logs to the resolved namespace', async () => {
    fetchMock
      .mockResolvedValueOnce(
        envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'text/plain' },
        text: async () => 'log line',
      });

    await useApi().getPipelinePodLogs({ podname: 'p', runid: 'r' });

    const url = calledUrls().find((u) => u.includes('/k8s/pod/logs'));
    expect(url).toContain('podnamespace=test5');
  });

  // --- env-info request itself ----------------------------------------------

  it('derives the env-info URL from the KFP API origin', async () => {
    fetchMock.mockResolvedValueOnce(
      envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
    );

    await useApi().getWorkgroupEnvInfo();

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://host.test/api/workgroup/env-info',
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    });
  });

  it('reports the status when env-info is rejected', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(useApi().getWorkgroupEnvInfo()).rejects.toThrow(
      'env-info failed: 403',
    );
  });

  it('re-reads env-info after the cache is reset', async () => {
    fetchMock.mockResolvedValue(
      envInfo([{ user: 'u', namespace: 'test5', role: 'owner' }]),
    );

    const api = useApi();
    await api.getWorkgroupEnvInfo();
    resetWorkgroupEnvInfo();
    await api.getWorkgroupEnvInfo();

    const envCalls = calledUrls().filter((u) => u.includes('env-info'));
    expect(envCalls).toHaveLength(2);
  });

  // --- pagination tokens must not leak between namespaces -------------------

  it('keeps pagination cursors separate per namespace', async () => {
    const pageWithToken = {
      ok: true,
      status: 200,
      json: async () => ({
        runs: [],
        total_size: 50,
        next_page_token: 'TOKEN-FROM-A',
      }),
    };
    fetchMock.mockResolvedValue(pageWithToken);

    const api = useApi();
    // Page 1 of namespace A hands back a cursor for its page 2.
    await api.getPipelineRunsListV2({ namespace: 'ns-a', page: 1 });
    await api.getPipelineRunsListV2({ namespace: 'ns-a', page: 2 });
    const aPageTwo = calledUrls().at(-1);
    expect(aPageTwo).toContain('page_token=TOKEN-FROM-A');

    // Namespace B must not inherit it — that would page through A's runs.
    await api.getPipelineRunsListV2({ namespace: 'ns-b', page: 2 });
    const bPageTwo = calledUrls().at(-1);
    expect(bPageTwo).toContain('namespace=ns-b');
    expect(bPageTwo).not.toContain('TOKEN-FROM-A');
  });
});
