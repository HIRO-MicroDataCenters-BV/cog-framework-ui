// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

const URL_PREFIX = process.env.URL_PREFIX || '';

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    'nuxt-zod-i18n',
    'dayjs-nuxt',
    '@nuxtjs/color-mode',
  ],
  // Enable SSR to get Nitro server for API endpoints
  // But use client-side rendering for pages (SPA mode)
  ssr: false,

  components: {
    dirs: [
      {
        path: '~/components/app',
        pathPrefix: false,
        prefix: 'App',
      },
      {
        path: '~/components/forms',
        pathPrefix: false,
        extensions: ['.vue'],
      },
      // UI components are handled by shadcn-nuxt, explicitly exclude from Nuxt scanning
    ],
  },
  devtools: { enabled: true },
  app: {
    baseURL: process.env.URL_PREFIX,
    buildAssetsDir: '/_nuxt/',
  },
  css: ['~/assets/css/tailwind.css'],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },
  runtimeConfig: {
    // Server-side only configuration (never exposed to client)
    dexHost: process.env.NUXT_DEX_HOST || '',
    dexUsername: process.env.NUXT_DEX_USERNAME || '',
    dexPassword: process.env.NUXT_DEX_PASSWORD || '',
    dexAuthType: process.env.NUXT_DEX_AUTH_TYPE || 'local',
    dexSkipTlsVerify: process.env.NUXT_DEX_SKIP_TLS_VERIFY === 'true',

    public: {
      apiBase: URL_PREFIX,
      mockEnabled: process.env.NUXT_PUBLIC_MOCK_ENABLED === 'true',
      federatedEnabled: process.env.NUXT_PUBLIC_FEDERATED_ENABLED === 'true',
      apiRuns: process.env.NUXT_PUBLIC_API_RUNS || '',
      appVersion: process.env.NUXT_COG_APP_VERSION || '1.11.27',
    },
  },
  compatibilityDate: '2024-11-01',
  nitro: {
    preset: 'static',
    output: {
      dir: '.output',
      publicDir: '.output/public',
    },
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
    devProxy: {
      '/cogapi': {
        target: process.env.NUXT_PUBLIC_API_REMOTE || '',
        changeOrigin: true,
        prependPath: true,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  hooks: {
    'components:extend'(components) {
      // Remove UI components registered by Nuxt to prevent duplicates with shadcn-nuxt
      for (let i = components.length - 1; i >= 0; i--) {
        const c = components[i];
        if (c.filePath.includes('/components/ui/')) {
          components.splice(i, 1);
        }
      }
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  i18n: {
    vueI18n: './i18n.config.ts',
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  icon: {
    serverBundle: {
      collections: ['lucide'],
    },
    customCollections: [
      {
        prefix: 'cog',
        dir: './assets/icons',
      },
    ],
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },
});
