/**
 * DEX OAuth Callback Handler
 *
 * Handles the OAuth callback from DEX after user authentication.
 * This endpoint is called when user completes login on DEX form.
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  // Get the authorization code and state from callback
  const code = query.code as string;
  const state = query.state as string;

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Missing authorization code',
    });
  }

  try {
    // The callback URL should have set cookies during the OAuth flow
    // We just need to verify the session cookie was set
    const sessionCookie = getCookie(event, 'authservice_session');

    if (sessionCookie) {
      // Session established successfully, redirect to app
      return sendRedirect(event, config.public.apiBase || '/', 302);
    }

    // If no session cookie, something went wrong
    throw createError({
      statusCode: 401,
      message: 'Failed to establish session',
    });
  } catch (error) {
    console.error('OAuth callback error:', error);

    // Redirect to login page with error
    return sendRedirect(event, '/login?error=auth_failed', 302);
  }
});
