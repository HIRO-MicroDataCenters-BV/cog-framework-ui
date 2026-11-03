import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getApiConfig } from '~/utils/apiConfig';

// Runs in the node environment (no `window`), like the composable specs that
// pin `apiBase` through a stubbed `useRuntimeConfig`. A `window` is stubbed
// per test where the runtime override is under test.
const buildConfig = {
  public: {
    apiBase: '/apidev',
    apiRuns: 'https://host.test/pipeline/apis/v2beta1',
    mockEnabled: false,
  },
};

describe('getApiConfig', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => buildConfig);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the build-time values when there is no window', () => {
    expect(typeof window).toBe('undefined');
    expect(getApiConfig()).toEqual({
      apiBase: '/apidev',
      apiRuns: 'https://host.test/pipeline/apis/v2beta1',
    });
  });

  it('prefers the runtime config and strips trailing slashes', () => {
    vi.stubGlobal('window', {
      __COGUI_CONFIG__: {
        apiBase: '/cogapi/',
        apiRuns: 'https://kfp.test/apis/v2beta1//',
      },
    });
    expect(getApiConfig()).toEqual({
      apiBase: '/cogapi',
      apiRuns: 'https://kfp.test/apis/v2beta1',
    });
  });

  it('falls back to the build-time value when the runtime value is empty', () => {
    vi.stubGlobal('window', {
      __COGUI_CONFIG__: { apiBase: '', apiRuns: '   ' },
    });
    expect(getApiConfig()).toEqual({
      apiBase: '/apidev',
      apiRuns: 'https://host.test/pipeline/apis/v2beta1',
    });
  });

  it('falls back per key when only apiBase is set at runtime', () => {
    vi.stubGlobal('window', { __COGUI_CONFIG__: { apiBase: '/cogapi' } });
    expect(getApiConfig()).toEqual({
      apiBase: '/cogapi',
      apiRuns: 'https://host.test/pipeline/apis/v2beta1',
    });
  });

  it('falls back when window has no config at all (config.js missing)', () => {
    vi.stubGlobal('window', {});
    expect(getApiConfig().apiBase).toBe('/apidev');
  });

  it('ignores non-string runtime values and strips build-time trailing slashes', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { apiBase: 'https://host.test/apidev/', apiRuns: undefined },
    }));
    vi.stubGlobal('window', {
      __COGUI_CONFIG__: { apiBase: 42, apiRuns: null },
    });
    expect(getApiConfig()).toEqual({
      apiBase: 'https://host.test/apidev',
      apiRuns: '',
    });
  });
});
