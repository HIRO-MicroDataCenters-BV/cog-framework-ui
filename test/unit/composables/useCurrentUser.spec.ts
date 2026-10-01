import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { WorkgroupEnvInfo } from '~/types/api.types';

// Nuxt auto-import shims, same approach as useEntitlements.spec.ts. `useApi` is
// the real composable rather than a stub: the namespace fields come from it, and
// the two composables reference each other, so stubbing it would hide that.
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
(globalThis as any).useApp = () => ({ setPage: vi.fn(), page: ref({}) });
(globalThis as any).useToaster = () => ({ show: vi.fn() });
(globalThis as any).fetch = fetchMock;

const { useApi, resetWorkgroupEnvInfo } = await import('~/composables/api');
(globalThis as any).useApi = useApi;
// Auto-imported from composables/api.ts in the app; vitest has no auto-imports.
(globalThis as any).resetWorkgroupEnvInfo = resetWorkgroupEnvInfo;

const { useCurrentUser } = await import('~/composables/useCurrentUser');
/* eslint-enable @typescript-eslint/no-explicit-any */

const headersResponse = (email: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    status_code: 200,
    message: 'Headers',
    data: { 'kubeflow-userid': email },
  }),
});

const envInfoResponse = (
  namespaces: WorkgroupEnvInfo['namespaces'],
  isClusterAdmin = false,
) => ({
  ok: true,
  status: 200,
  json: async () => ({
    user: 'test5@hiro.com',
    namespaces,
    isClusterAdmin,
  }),
});

const calledUrls = () => fetchMock.mock.calls.map((c) => String(c[0]));

describe('useCurrentUser', () => {
  beforeEach(() => {
    stateStore.clear();
    fetchMock.mockReset();
    resetWorkgroupEnvInfo();
  });

  // Regression guard: useApi() reads namespace state, so if useCurrentUser were
  // to construct useApi() at its own top level the two would recurse forever.
  it('constructs without recursing into useApi', () => {
    expect(() => useCurrentUser()).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records the namespace the signed-in user owns', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('test5@hiro.com'))
      .mockResolvedValueOnce(
        envInfoResponse([
          { user: 'test5@hiro.com', namespace: 'test5', role: 'owner' },
        ]),
      );

    const { fetchCurrentUser, user } = useCurrentUser();
    await fetchCurrentUser();

    expect(user.value).toMatchObject({
      email: 'test5@hiro.com',
      name: 'Test5',
      namespace: 'test5',
      isClusterAdmin: false,
    });
    expect(user.value?.namespaces).toHaveLength(1);
  });

  it('prefers the owned namespace over one merely shared with the user', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('test5@hiro.com'))
      .mockResolvedValueOnce(
        envInfoResponse([
          { user: 'other@hiro.com', namespace: 'shared', role: 'contributor' },
          { user: 'test5@hiro.com', namespace: 'test5', role: 'owner' },
        ]),
      );

    const { fetchCurrentUser, user } = useCurrentUser();
    await fetchCurrentUser();

    expect(user.value?.namespace).toBe('test5');
    expect(user.value?.namespaces).toHaveLength(2);
  });

  // The real condition behind "No Kubeflow namespace resolved for this user":
  // the account authenticates but has no Kubeflow profile.
  it('reports a null namespace when the user has no workspace', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('test2@hiro.com'))
      .mockResolvedValueOnce(envInfoResponse([]));

    const { fetchCurrentUser, user } = useCurrentUser();
    await fetchCurrentUser();

    expect(user.value?.email).toBe('test2@hiro.com');
    expect(user.value?.namespace).toBeNull();
    expect(user.value?.namespaces).toEqual([]);
  });

  it('carries the cluster-admin flag through', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('admin@hiro.com'))
      .mockResolvedValueOnce(
        envInfoResponse(
          [{ user: 'admin@hiro.com', namespace: 'admin', role: 'owner' }],
          true,
        ),
      );

    const { fetchCurrentUser, user } = useCurrentUser();
    await fetchCurrentUser();

    expect(user.value?.isClusterAdmin).toBe(true);
  });

  it('records an error and leaves the user unset when env-info fails', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('test5@hiro.com'))
      .mockResolvedValueOnce({ ok: false, status: 403 });

    const { fetchCurrentUser, user, error } = useCurrentUser();
    await fetchCurrentUser();

    expect(user.value).toBeNull();
    expect(error.value).toContain('env-info failed: 403');
  });

  // Signing a different user into the same tab must not reuse the first one's
  // namespace, so clearUser drops the cached env-info as well as the state.
  it('drops the cached namespace on sign-out', async () => {
    fetchMock
      .mockResolvedValueOnce(headersResponse('test5@hiro.com'))
      .mockResolvedValueOnce(
        envInfoResponse([
          { user: 'test5@hiro.com', namespace: 'test5', role: 'owner' },
        ]),
      );

    const { fetchCurrentUser, clearUser, user } = useCurrentUser();
    await fetchCurrentUser();
    expect(user.value?.namespace).toBe('test5');

    clearUser();
    expect(user.value).toBeNull();

    fetchMock
      .mockResolvedValueOnce(headersResponse('other@hiro.com'))
      .mockResolvedValueOnce(
        envInfoResponse([
          { user: 'other@hiro.com', namespace: 'other', role: 'owner' },
        ]),
      );
    await fetchCurrentUser();

    expect(user.value?.namespace).toBe('other');
    expect(calledUrls().filter((u) => u.includes('env-info'))).toHaveLength(2);
  });
});
