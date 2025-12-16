/**
 * DEX Interactive Login Redirect
 *
 * Redirects user to DEX login form for interactive authentication.
 * This is used when user needs to login manually.
 */

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const dexHost = config.dexHost;
  const authType = config.dexAuthType || 'local';
  const redirectUri = (query.redirect_uri as string) || '/';

  if (!dexHost) {
    throw createError({
      statusCode: 500,
      message: 'DEX host not configured',
    });
  }

  // Build DEX login URL
  const loginUrl = `${dexHost}/dex/auth/${authType}/login`;
  const params = new URLSearchParams();

  // Add state parameter for CSRF protection
  const state = Math.random().toString(36).substring(7);
  params.set('state', state);

  // Store redirect URI in cookie for after login
  setCookie(event, 'auth_redirect', redirectUri, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Store state in cookie for verification
  setCookie(event, 'auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const fullLoginUrl = `${loginUrl}?${params.toString()}`;

  return sendRedirect(event, fullLoginUrl, 302);
});
