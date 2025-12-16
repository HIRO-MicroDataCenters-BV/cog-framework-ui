/**
 * DEX Session Refresh Endpoint
 * 
 * POST /api/auth/refresh
 * 
 * Refreshes the DEX session by re-authenticating with service account.
 */

import { getDexSessionCookie } from '~/server/utils/dex-auth';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    const username = config.dexUsername;
    const password = config.dexPassword;
    const host = config.dexHost;
    const authType = config.dexAuthType || 'local';
    const skipTlsVerify = config.dexSkipTlsVerify || false;

    if (!host || !username || !password) {
        throw createError({
            statusCode: 500,
            message: 'DEX configuration is incomplete',
        });
    }

    try {
        // Re-authenticate to get fresh session
        const result = await getDexSessionCookie({
            host,
            username,
            password,
            authType,
            skipTlsVerify,
        });

        if (!result.success || !result.cookie) {
            throw createError({
                statusCode: 401,
                message: result.error || 'Session refresh failed',
            });
        }

        // Update session cookie
        setCookie(event, 'authservice_session', result.cookie, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: result.expiresAt
                ? Math.floor((result.expiresAt - Date.now()) / 1000)
                : 86400,
            path: '/',
        });

        // Update expiration time
        if (result.expiresAt) {
            setCookie(event, 'auth_expires_at', result.expiresAt.toString(), {
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                maxAge: Math.floor((result.expiresAt - Date.now()) / 1000),
                path: '/',
            });
        }

        return {
            success: true,
            expiresAt: result.expiresAt,
        };
    } catch (error) {
        console.error('DEX refresh error:', error);

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Internal server error during session refresh',
        });
    }
});
