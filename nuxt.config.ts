// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: '/cogui/',
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    'nuxt-zod-i18n',
    '@nuxt/icon',
  ],
  colorMode: {
    classSuffix: '',
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    }
  },
  i18n: {
    vueI18n: './i18n.config.ts',
  },
  ssr: false,
  eslint: {
    config: {
      stylistic: true,
    },
  },
  runtimeConfig: {
    public: {
      apiBase: '',
    },
  },
  nitro: {
    preset: 'github-pages',
    runtimeConfig: {
      app: {
        baseURL: '/cogui/',
      },
    },
    baseURL: '/cogui/',
  },
});
