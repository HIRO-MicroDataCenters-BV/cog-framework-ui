/**
 * DEX Authentication Composable - Background Auth Version
 *
 * Assumes authservice is already configured and handles OAuth.
 * Just checks for existing session cookie.
 */

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  error?: string;
}

export const useDexAuth = () => {
  const authState = useState<AuthState>('dex-auth', () => ({
    authenticated: false,
    loading: false,
  }));

  /**
   * Check if we have a valid session cookie
   */
  const checkStatus = async (): Promise<boolean> => {
    // Check for authservice_session cookie
    const cookies = document.cookie.split(';');
    const hasSession = cookies.some((c) =>
      c.trim().startsWith('authservice_session='),
    );

    authState.value.authenticated = hasSession;
    return hasSession;
  };

  /**
   * Initialize - just check for existing session
   */
  const initialize = async () => {
    authState.value.loading = true;

    try {
      await checkStatus();
    } catch (error) {
      console.error('Auth check failed:', error);
      authState.value.authenticated = false;
    } finally {
      authState.value.loading = false;
    }
  };

  /**
   * Logout - clear session cookie
   */
  const logout = async () => {
    document.cookie =
      'authservice_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    authState.value.authenticated = false;
  };

  return {
    // State
    isAuthenticated: computed(() => authState.value.authenticated),
    isLoading: computed(() => authState.value.loading),
    error: computed(() => authState.value.error),

    // Methods
    checkStatus,
    initialize,
    logout,
  };
};
