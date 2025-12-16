/**
 * DEX Logout Endpoint
 * 
 * POST /api/auth/logout
 * 
 * Clears the DEX session cookies.
 */

export default defineEventHandler((event) => {
    deleteCookie(event, 'authservice_session');
    deleteCookie(event, 'auth_expires_at');

    return {
        success: true,
        message: 'Logged out successfully',
    };
});
