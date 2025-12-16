/**
 * Global Authentication Middleware
 *
 * Note: Authentication initialization is handled by the auth plugin.
 * This middleware is kept for future route protection if needed.
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Authentication is handled by plugin
  // Middleware can be used for route-specific protection in the future
  return;
});
