/**
 * Resolves the API endpoints the browser should call.
 *
 * The image is a static Nuxt build (`ssr: false`, `nitro.preset: 'static'`)
 * served by nginx, so `runtimeConfig.public` is frozen at build time
 * (`NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_API_RUNS`). To let one image serve any
 * deployment, `entrypoint.sh` writes `<URL_PREFIX>config.js` from the `API_BASE`
 * / `API_RUNS` container env and `nuxt.config.ts` loads it from `<head>` as a
 * classic (blocking) script ahead of the module entry, so
 * `window.__COGUI_CONFIG__` is populated before any composable runs. A missing
 * or empty file only fires a script error event and the build-time values
 * apply, so a dev server or an old charm keeps working unchanged.
 *
 * Trailing slashes are stripped because callers concatenate `${apiBase}${url}`
 * with `url` starting with `/` (see `composables/api.ts`).
 */

export interface ApiConfig {
  /** CogAPI base: same-origin path (`/apidev`) or absolute URL, no trailing slash. */
  apiBase: string;
  /** KFP v2beta1 base, no trailing slash; `''` when not configured. */
  apiRuns: string;
}

/** Shape written by `entrypoint.sh` into `config.js`. Every key is optional. */
export interface CoguiRuntimeConfig {
  apiBase?: string;
  apiRuns?: string;
}

declare global {
  interface Window {
    __COGUI_CONFIG__?: CoguiRuntimeConfig;
  }
}

const normalise = (value: unknown): string =>
  typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';

/**
 * Runtime value (`window.__COGUI_CONFIG__`) wins when it is a non-empty string;
 * otherwise the build-time `useRuntimeConfig().public` value is used. The
 * `window` guard keeps node-environment vitest specs on the stubbed
 * `useRuntimeConfig`.
 */
export const getApiConfig = (): ApiConfig => {
  const build = useRuntimeConfig().public as Record<string, unknown>;
  const runtime: CoguiRuntimeConfig =
    typeof window !== 'undefined' ? (window.__COGUI_CONFIG__ ?? {}) : {};

  const pick = (key: keyof CoguiRuntimeConfig): string =>
    normalise(runtime[key]) || normalise(build[key]);

  return { apiBase: pick('apiBase'), apiRuns: pick('apiRuns') };
};
