/**
 * Authenticated API Proxy Endpoint
 * 
 * Proxies requests to COG API with DEX session cookie attached.
 * 
 * Usage: /api/proxy/pipeline/apis/v2beta1/runs
 * Proxies to: {NUXT_PUBLIC_API_BASE}/pipeline/apis/v2beta1/runs
 */

import { getDexSessionCookie } from '~/server/utils/dex-auth';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const sessionCookie = getCookie(event, 'authservice_session');

    // Check if authenticated
    if (!sessionCookie) {
        // Attempt automatic re-authentication with service account
        try {
            const loginResult = await getDexSessionCookie({
                host: config.dexHost,
                username: config.dexUsername,
                password: config.dexPassword,
                authType: config.dexAuthType || 'local',
                skipTlsVerify: config.dexSkipTlsVerify || false,
            });

            if (loginResult.success && loginResult.cookie) {
                // Store new session cookie
                setCookie(event, 'authservice_session', loginResult.cookie, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: loginResult.expiresAt
                        ? Math.floor((loginResult.expiresAt - Date.now()) / 1000)
                        : 86400,
                    path: '/',
                });

                // Use the new cookie for this request
                return await proxyRequest(event, loginResult.cookie, config);
            }
        } catch (error) {
            console.error('Auto-authentication failed:', error);
        }

        throw createError({
            statusCode: 401,
            message: 'Authentication required',
        });
    }

    return await proxyRequest(event, sessionCookie, config);
});

/**
 * Proxies the request to the target API
 */
async function proxyRequest(event: any, sessionCookie: string, config: any) {
    // Extract the path after /api/proxy/
    const path = event.path.replace(/^\/api\/proxy/, '');

    // Determine target base URL
    let targetBase = config.public.apiBase;

    // If path starts with /pipeline, use the runs API
    if (path.startsWith('/pipeline')) {
        targetBase = config.public.apiRuns || config.dexHost;
    }

    const targetUrl = `${targetBase}${path}`;

    // Get query parameters
    const query = getQuery(event);
    const queryString = new URLSearchParams(query as Record<string, string>).toString();
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    // Prepare headers
    const headers: Record<string, string> = {
        'Cookie': sessionCookie,
        'User-Agent': 'Nuxt-Proxy/1.0',
    };

    // Copy relevant headers from original request
    const originalHeaders = getHeaders(event);
    const headersToForward = ['content-type', 'accept', 'authorization'];

    for (const header of headersToForward) {
        if (originalHeaders[header]) {
            headers[header] = originalHeaders[header];
        }
    }

    // Get request body if present
    let body: any;
    const method = event.method;

    if (method !== 'GET' && method !== 'HEAD') {
        try {
            body = await readBody(event);
        } catch {
            // No body or error reading body
        }
    }

    try {
        // Make the proxied request
        const response = await fetch(fullUrl, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Check if session expired (401/403)
        if (response.status === 401 || response.status === 403) {
            // Try to refresh session
            try {
                const loginResult = await getDexSessionCookie({
                    host: config.dexHost,
                    username: config.dexUsername,
                    password: config.dexPassword,
                    authType: config.dexAuthType || 'local',
                    skipTlsVerify: config.dexSkipTlsVerify || false,
                });

                if (loginResult.success && loginResult.cookie) {
                    // Update cookie
                    setCookie(event, 'authservice_session', loginResult.cookie, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: loginResult.expiresAt
                            ? Math.floor((loginResult.expiresAt - Date.now()) / 1000)
                            : 86400,
                        path: '/',
                    });

                    // Retry request with new cookie
                    const retryResponse = await fetch(fullUrl, {
                        method,
                        headers: {
                            ...headers,
                            'Cookie': loginResult.cookie,
                        },
                        body: body ? JSON.stringify(body) : undefined,
                    });

                    return await handleResponse(retryResponse);
                }
            } catch (error) {
                console.error('Session refresh failed:', error);
            }
        }

        return await handleResponse(response);

    } catch (error) {
        console.error('Proxy request failed:', error);
        throw createError({
            statusCode: 502,
            message: 'Failed to proxy request to target API',
        });
    }
}

/**
 * Handles the proxied response
 */
async function handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');

    // Handle JSON responses
    if (contentType?.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                message: data.message || data.detail || 'Request failed',
                data,
            });
        }

        return data;
    }

    // Handle text responses
    if (contentType?.includes('text/')) {
        const text = await response.text();

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                message: text || 'Request failed',
            });
        }

        return text;
    }

    // Handle binary responses
    const buffer = await response.arrayBuffer();

    if (!response.ok) {
        throw createError({
            statusCode: response.status,
            message: 'Request failed',
        });
    }

    return buffer;
}
