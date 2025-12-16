/**
 * DEX Authentication Composable
 * 
 * Provides client-side authentication state management and methods.
 * Handles automatic session refresh and background authentication.
 */

interface AuthState {
    authenticated: boolean;
    expiresAt?: number;
    loading: boolean;
    error?: string;
}

export const useDexAuth = () => {
    const authState = useState<AuthState>('dex-auth', () => ({
        authenticated: false,
        loading: false,
    }));

    let refreshTimer: NodeJS.Timeout | null = null;

    /**
     * Checks current authentication status
     */
    const checkStatus = async (): Promise<boolean> => {
        try {
            const response = await $fetch<{
                authenticated: boolean;
                expiresAt?: number;
                expired?: boolean;
                invalid?: boolean;
            }>('/api/auth/status');

            authState.value = {
                authenticated: response.authenticated,
                expiresAt: response.expiresAt,
                loading: false,
            };

            // Schedule refresh if authenticated
            if (response.authenticated && response.expiresAt) {
                scheduleRefresh(response.expiresAt);
            }

            return response.authenticated;
        } catch (error) {
            authState.value = {
                authenticated: false,
                loading: false,
                error: 'Failed to check authentication status',
            };
            return false;
        }
    };

    /**
     * Performs login with optional credentials
     */
    const login = async (username?: string, password?: string): Promise<boolean> => {
        authState.value.loading = true;
        authState.value.error = undefined;

        try {
            const response = await $fetch<{
                success: boolean;
                message: string;
                expiresAt?: number;
            }>('/api/auth/login', {
                method: 'POST',
                body: username && password ? { username, password } : {},
            });

            if (response.success) {
                authState.value = {
                    authenticated: true,
                    expiresAt: response.expiresAt,
                    loading: false,
                };

                // Schedule refresh
                if (response.expiresAt) {
                    scheduleRefresh(response.expiresAt);
                }

                return true;
            }

            authState.value = {
                authenticated: false,
                loading: false,
                error: response.message,
            };

            return false;
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Authentication failed';

            authState.value = {
                authenticated: false,
                loading: false,
                error: errorMessage,
            };

            console.error('Authentication failed:', errorMessage);
            return false;
        }
    };

    /**
     * Refreshes the current session
     */
    const refreshSession = async (): Promise<boolean> => {
        try {
            const response = await $fetch<{
                success: boolean;
                expiresAt?: number;
            }>('/api/auth/refresh', {
                method: 'POST',
            });

            if (response.success) {
                authState.value = {
                    authenticated: true,
                    expiresAt: response.expiresAt,
                    loading: false,
                };

                // Schedule next refresh
                if (response.expiresAt) {
                    scheduleRefresh(response.expiresAt);
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error('Session refresh failed:', error);

            // Try full re-login
            return await login();
        }
    };

    /**
     * Logs out and clears session
     */
    const logout = async (): Promise<void> => {
        try {
            await $fetch('/api/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            authState.value = {
                authenticated: false,
                loading: false,
            };

            // Clear refresh timer
            if (refreshTimer) {
                clearTimeout(refreshTimer);
                refreshTimer = null;
            }
        }
    };

    /**
     * Schedules automatic session refresh before expiration
     */
    const scheduleRefresh = (expiresAt: number): void => {
        // Clear existing timer
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }

        // Calculate refresh time (5 minutes before expiration)
        const refreshTime = expiresAt - Date.now() - 5 * 60 * 1000;

        if (refreshTime > 0) {
            refreshTimer = setTimeout(() => {
                refreshSession();
            }, refreshTime);
        } else {
            // Already expired or about to expire, refresh immediately
            refreshSession();
        }
    };

    /**
     * Initializes authentication (checks status and auto-login if needed)
     */
    const initialize = async (): Promise<void> => {
        const isAuthenticated = await checkStatus();

        if (!isAuthenticated) {
            // Attempt background authentication with service account
            await login();
        }
    };

    return {
        // State
        authState: readonly(authState),
        isAuthenticated: computed(() => authState.value.authenticated),
        isLoading: computed(() => authState.value.loading),
        error: computed(() => authState.value.error),
        expiresAt: computed(() => authState.value.expiresAt),

        // Methods
        login,
        logout,
        checkStatus,
        refreshSession,
        initialize,
    };
};
