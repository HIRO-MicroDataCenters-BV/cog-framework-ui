/**
 * DEX Authentication Status Endpoint
 * 
 * GET /api/auth/status
 * 
 * Checks if the user has a valid DEX session.
 */

import { validateDexSession } from '~/server/utils/dex-auth';

export default defineEventHandler(async (event) => {
    const sessionCookie = getCookie(event, 'authservice_session');
    const expiresAtCookie = getCookie(event, 'auth_expires_at');

    if (!sessionCookie) {
        return {
            authenticated: false,
        };
    }

    const expiresAt = expiresAtCookie ? parseInt(expiresAtCookie, 10) : undefined;

    // Check if cookie has expired
    if (expiresAt && expiresAt < Date.now()) {
        return {
            authenticated: false,
            expired: true,
        };
    }

    // Optionally validate the session with DEX
    const config = useRuntimeConfig();
    const isValid = await validateDexSession(sessionCookie, config.dexHost);

    if (!isValid) {
        // Clear invalid cookies
        deleteCookie(event, 'authservice_session');
        deleteCookie(event, 'auth_expires_at');

        return {
            authenticated: false,
            invalid: true,
        };
    }

    return {
        authenticated: true,
        expiresAt,
    };
});
