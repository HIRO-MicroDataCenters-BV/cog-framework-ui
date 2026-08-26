/**
 * Admin Tier Route Middleware
 *
 * Blocks admin-only routes (e.g. the Dashboard) before the page component
 * mounts, so a lower-tier user typing the URL directly never renders the page
 * or triggers its data fetches — they are redirected to datasets instead.
 *
 * Fails closed: if entitlements cannot be resolved, access is denied.
 * Mock/demo mode resolves to the admin fixture and the route stays open, unless
 * the tier was overridden to a lower one via `?tier=` (see `useEntitlements`),
 * in which case this guard redirects just as it would in production.
 *
 * @example
 * ```ts
 * // in a page component
 * definePageMeta({ middleware: 'admin' });
 * ```
 */
export default defineNuxtRouteMiddleware(async () => {
  // SPA app (ssr: false) — the guard only makes sense on the client.
  if (import.meta.server) return;

  const { fetchEntitlements, isAdmin } = useEntitlements();
  await fetchEntitlements();

  if (!isAdmin.value) {
    return navigateTo('/datasets', { replace: true });
  }
});
