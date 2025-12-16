/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Example: Using DEX Authentication with Proxy
 *
 * This file demonstrates how to make authenticated API calls using the proxy endpoint.
 * You can integrate this pattern into your existing API composable.
 */

export const useAuthenticatedApi = () => {
  /**
   * Makes an authenticated request through the proxy
   */
  const authenticatedRequest = async (
    path: string,
    method: string = 'GET',
    body?: unknown,
  ) => {
    const opts: RequestInit = {
      method,
    };

    if (body && method !== 'GET') {
      opts.body = body as BodyInit;
    }

    try {
      // Use the proxy endpoint which handles authentication automatically
      const response = await $fetch(`/api/proxy${path}`, opts);
      return response;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  return {
    /**
     * Example: Get models with authentication
     */
    getModels: async (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return authenticatedRequest(`/models${query}`);
    },

    /**
     * Example: Create a model with authentication
     */
    postModel: async (data: unknown) => {
      return authenticatedRequest('/models', 'POST', data);
    },

    /**
     * Example: Get pipeline runs with authentication
     */
    getPipelineRuns: async () => {
      return authenticatedRequest('/pipeline/apis/v2beta1/runs');
    },

    /**
     * Generic authenticated request
     */
    request: authenticatedRequest,
  };
};

/**
 * Alternative: Extend existing useApi composable
 *
 * You can modify the existing useApi composable to use the proxy:
 *
 * 1. Add a flag to enable proxy mode:
 *    const useProxy = true;
 *
 * 2. Update the request function:
 *    const url = useProxy ? `/api/proxy${endpoint}` : `${baseUrl}${endpoint}`;
 *
 * 3. Remove Authorization header when using proxy:
 *    if (!useProxy && token.value) {
 *      headers['Authorization'] = `Bearer ${token.value}`;
 *    }
 */
