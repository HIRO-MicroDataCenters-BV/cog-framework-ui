import type { HeadersResponse } from '~/types/api.types';

export interface CurrentUser {
  email: string;
  name: string;
  avatarUrl?: string;
}

interface CurrentUserState {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * Composable for managing the current logged-in user
 *
 * Fetches user information from the /headers endpoint
 * and extracts the kubeflow-userid header.
 */
export const useCurrentUser = () => {
  const state = useState<CurrentUserState>('current-user', () => ({
    user: null,
    loading: false,
    error: null,
  }));

  const api = useApi();

  /**
   * Extracts user name from email
   * @param email - The email address
   * @returns The name part before @
   */
  const extractNameFromEmail = (email: string): string => {
    const namePart = email.split('@')[0];
    // Convert dots/underscores to spaces and capitalize each word
    return namePart
      .replace(/[._]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Fetches the current user information from headers
   */
  const fetchCurrentUser = async (): Promise<void> => {
    if (state.value.loading) return;
    state.value.loading = true;
    state.value.error = null;

    try {
      const response = (await api.getHeaders()) as HeadersResponse;
      if (response?.data?.['kubeflow-userid']) {
        const email = response.data['kubeflow-userid'];
        state.value.user = {
          email,
          name: extractNameFromEmail(email),
        };
      } else {
        state.value.error = 'User ID not found in headers';
      }
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : 'Failed to fetch user';
      console.error('Failed to fetch current user:', error);
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * Clears the current user state
   */
  const clearUser = (): void => {
    state.value.user = null;
    state.value.error = null;
  };

  return {
    // State
    user: computed(() => state.value.user),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),

    // Methods
    fetchCurrentUser,
    clearUser,
  };
};
