/**
 * DEX Authentication Utility
 *
 * Implements programmatic DEX authentication flow to obtain authservice_session cookie.
 * Based on the authentication architecture documented in the project.
 *
 * Flow:
 * 1. GET host → redirects to /oauth2/start
 * 2. GET /oauth2/start → redirects to /dex/auth/{type}
 * 3. GET /dex/auth/{type} → redirects to /dex/auth/{type}/login
 * 4. POST /dex/auth/{type}/login with credentials → redirects to callback
 * 5. Handle /approval if needed
 * 6. Extract authservice_session cookie
 */

interface DexAuthOptions {
  host: string;
  username: string;
  password: string;
  authType?: string;
  skipTlsVerify?: boolean;
}

interface DexSessionResult {
  success: boolean;
  cookie?: string;
  error?: string;
  expiresAt?: number;
}

/**
 * Retrieves a DEX session cookie by performing programmatic login
 *
 * @param options - Authentication options
 * @returns Session result with cookie or error
 */
export async function getDexSessionCookie(
  options: DexAuthOptions,
): Promise<DexSessionResult> {
  const {
    host,
    username,
    password,
    authType = 'local',
    skipTlsVerify = false,
  } = options;

  try {
    // Create a cookie jar to track cookies across requests
    const cookieJar: string[] = [];

    const fetchOptions: RequestInit = {
      redirect: 'manual', // Handle redirects manually
      headers: {
        'User-Agent': 'Nuxt-DEX-Client/1.0',
      },
    };

    // Step 1: Initial request to host
    let response = await fetch(host, fetchOptions);
    updateCookieJar(cookieJar, response);

    // Step 2: Follow redirects to /oauth2/start if we get 403
    if (
      response.status === 403 ||
      response.status === 302 ||
      response.status === 307
    ) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        const url = new URL(redirectUrl, host);
        // If not already at oauth2/start, redirect there
        if (!url.pathname.includes('/oauth2/start')) {
          url.pathname = '/oauth2/start';
          url.searchParams.set('rd', url.pathname);
        }

        response = await fetch(url.toString(), {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Cookie: cookieJar.join('; '),
          },
        });
        updateCookieJar(cookieJar, response);
      }
    }

    // Step 3: Follow redirects to DEX auth endpoint
    let currentUrl = response.headers.get('location');
    let attempts = 0;
    const maxAttempts = 10;

    while (currentUrl && attempts < maxAttempts) {
      attempts++;
      const url = new URL(currentUrl, host);

      response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Cookie: cookieJar.join('; '),
        },
      });

      updateCookieJar(cookieJar, response);

      // Check if we've reached the login page
      if (url.pathname.includes('/auth/') && !url.pathname.endsWith('/login')) {
        // Append /login to the path if needed
        url.pathname = url.pathname.replace(/\/auth$/, `/auth/${authType}`);
        if (!url.pathname.endsWith('/login')) {
          url.pathname += '/login';
        }

        response = await fetch(url.toString(), {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Cookie: cookieJar.join('; '),
          },
        });
        updateCookieJar(cookieJar, response);
        break;
      }

      currentUrl = response.headers.get('location');
    }

    // Step 4: Get the login page URL from the final response
    const loginUrl = response.url || currentUrl;
    if (!loginUrl) {
      return {
        success: false,
        error: 'Failed to reach DEX login page',
      };
    }

    // Step 5: POST credentials to login endpoint
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieJar.join('; '),
        'User-Agent': 'Nuxt-DEX-Client/1.0',
      },
      body: new URLSearchParams({
        login: username,
        password: password,
      }).toString(),
    });

    updateCookieJar(cookieJar, loginResponse);

    // Step 6: Check if login was successful (should redirect)
    if (
      loginResponse.status !== 302 &&
      loginResponse.status !== 303 &&
      loginResponse.status !== 307
    ) {
      return {
        success: false,
        error: 'DEX login failed: no redirect after credentials submission',
      };
    }

    // Step 7: Follow redirect chain after login
    let postLoginUrl = loginResponse.headers.get('location');
    attempts = 0;

    while (postLoginUrl && attempts < maxAttempts) {
      attempts++;
      const url = new URL(postLoginUrl, host);

      response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Cookie: cookieJar.join('; '),
        },
      });

      updateCookieJar(cookieJar, response);

      // Step 8: Handle approval page if present
      if (url.pathname.endsWith('/approval')) {
        response = await fetch(url.toString(), {
          method: 'POST',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookieJar.join('; '),
            'User-Agent': 'Nuxt-DEX-Client/1.0',
          },
          body: new URLSearchParams({
            approval: 'approve',
          }).toString(),
        });

        updateCookieJar(cookieJar, response);
      }

      postLoginUrl = response.headers.get('location');

      // If we've stopped redirecting, we should have the session cookie
      if (!postLoginUrl || response.status === 200) {
        break;
      }
    }

    // Step 9: Extract authservice_session cookie
    const sessionCookie = cookieJar.find((cookie) =>
      cookie.includes('authservice_session='),
    );

    if (!sessionCookie) {
      return {
        success: false,
        error: 'Failed to obtain authservice_session cookie',
      };
    }

    // Extract cookie value and expiration
    const cookieValue = sessionCookie.split(';')[0];
    const expiresMatch = sessionCookie.match(/expires=([^;]+)/i);
    let expiresAt: number | undefined;

    if (expiresMatch) {
      expiresAt = new Date(expiresMatch[1]).getTime();
    } else {
      // Default to 24 hours if no expiration is set
      expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    return {
      success: true,
      cookie: cookieValue,
      expiresAt,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during DEX authentication',
    };
  }
}

/**
 * Updates the cookie jar with cookies from a response
 */
function updateCookieJar(cookieJar: string[], response: Response): void {
  const setCookieHeaders = response.headers.getSetCookie?.() || [];

  for (const setCookie of setCookieHeaders) {
    const cookieName = setCookie.split('=')[0];

    // Remove existing cookie with same name
    const existingIndex = cookieJar.findIndex((c) =>
      c.startsWith(cookieName + '='),
    );
    if (existingIndex !== -1) {
      cookieJar.splice(existingIndex, 1);
    }

    // Add new cookie
    cookieJar.push(setCookie);
  }
}

/**
 * Validates if a DEX session cookie is still valid
 *
 * @param cookie - The session cookie to validate
 * @param host - DEX host URL
 * @returns Validation result
 */
export async function validateDexSession(
  cookie: string,
  host: string,
): Promise<boolean> {
  try {
    // Try to access a protected endpoint with the cookie
    const response = await fetch(`${host}/pipeline/apis/v2beta1/healthz`, {
      headers: {
        Cookie: cookie,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extracts expiration time from a cookie string
 *
 * @param cookie - Cookie string
 * @returns Expiration timestamp or undefined
 */
export function getCookieExpiration(cookie: string): number | undefined {
  const expiresMatch = cookie.match(/expires=([^;]+)/i);
  if (expiresMatch) {
    return new Date(expiresMatch[1]).getTime();
  }
  return undefined;
}
