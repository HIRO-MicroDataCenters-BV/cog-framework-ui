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
    'dayjs-nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode'
  ],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  colorMode: {
    classSuffix: '',
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    },
    customCollections: [
      {
        prefix: 'cog',
        dir: './assets/icons'
      },
    ],
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
      appVersion: '0.0.1',
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
