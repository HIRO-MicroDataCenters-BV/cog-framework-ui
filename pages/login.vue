<script setup lang="ts">
/**
 * Login Page
 *
 * Provides options for user authentication:
 * 1. Automatic background login (if service account configured)
 * 2. Interactive login through DEX form
 */

const route = useRoute();
const router = useRouter();
const { login, isAuthenticated, isLoading, error } = useDexAuth();

const loginError = ref<string | null>(null);
const loginMode = ref<'auto' | 'manual'>('auto');

// Check for error from callback
onMounted(() => {
  if (route.query.error) {
    loginError.value = 'Authentication failed. Please try again.';
  }
});

// Watch authentication state
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    // Redirect to home or intended page
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  }
});

// Attempt automatic login on mount
onMounted(async () => {
  if (!isAuthenticated.value) {
    try {
      await login();
    } catch (err) {
      console.error('Auto-login failed:', err);
      loginMode.value = 'manual';
    }
  }
});

// Manual login through DEX form
const loginWithDex = () => {
  const redirectUri = (route.query.redirect as string) || '/';
  window.location.href = `/api/auth/redirect?redirect_uri=${encodeURIComponent(redirectUri)}`;
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          COG Framework
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to continue
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          ></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loginError || error" class="mb-6">
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p class="text-sm text-red-800 dark:text-red-200">
              {{ loginError || error }}
            </p>
          </div>
        </div>

        <!-- Manual Login -->
        <div v-if="!isLoading && loginMode === 'manual'" class="space-y-6">
          <div class="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Automatic authentication is not available.</p>
            <p class="mt-2">Please sign in using your DEX credentials.</p>
          </div>

          <button
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            @click="loginWithDex"
          >
            Sign in with DEX
          </button>
        </div>

        <!-- Auto Login Info -->
        <div
          v-else-if="!isLoading"
          class="text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>If automatic authentication fails, you can:</p>
          <button
            class="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            @click="loginMode = 'manual'"
          >
            Sign in manually
          </button>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="text-center text-xs text-gray-500 dark:text-gray-500">
        <p>Powered by DEX Authentication</p>
      </div>
    </div>
  </div>
</template>
