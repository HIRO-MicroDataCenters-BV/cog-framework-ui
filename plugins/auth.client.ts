/**
 * DEX Authentication Plugin
 *
 * Initializes background authentication when the app starts.
 * Runs only on client-side.
 */

export default defineNuxtPlugin({
  name: 'dex-auth',
  async setup() {
    // Initialize authentication in the background
    const { initialize } = useDexAuth();

    try {
      await initialize();
      console.log('DEX authentication initialized');
    } catch (error) {
      console.error('Background authentication failed:', error);
      // Continue anyway - the proxy will handle re-authentication
    }
  },
});
