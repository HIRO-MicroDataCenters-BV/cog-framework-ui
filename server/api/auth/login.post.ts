/**
 * DEX Login Endpoint
 * 
 * POST /api/auth/login
 * 
 * Initiates DEX authentication and stores session cookie.
 * Can accept optional username/password or use service account credentials.
 */

import { getDexSessionCookie } from '~/server/utils/dex-auth';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody(event).catch(() => ({}));

    // Use provided credentials or fall back to service account
    const username = body.username || config.dexUsername;
    const password = body.password || config.dexPassword;
    const host = config.dexHost;
    const authType = config.dexAuthType || 'local';
    const skipTlsVerify = config.dexSkipTlsVerify || false;

    if (!host || !username || !password) {
        throw createError({
            statusCode: 400,
            message: 'DEX configuration is incomplete. Please check environment variables.',
        });
    }

    try {
        // Attempt to get DEX session cookie
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
                message: result.error || 'Authentication failed',
            });
        }

        // Store session cookie in httpOnly cookie
        setCookie(event, 'authservice_session', result.cookie, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: result.expiresAt
                ? Math.floor((result.expiresAt - Date.now()) / 1000)
                : 86400, // 24 hours default
            path: '/',
        });

        // Also store expiration time in a separate cookie for client-side checking
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
            message: 'Authentication successful',
            expiresAt: result.expiresAt,
        };
    } catch (error) {
        console.error('DEX login error:', error);

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Internal server error during authentication',
        });
    }
});
