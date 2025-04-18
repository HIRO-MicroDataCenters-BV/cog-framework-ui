// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

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
  ssr: false,
  devtools: { enabled: true },
  app: {
    baseURL: '/cogui/',
  },
  css: ['~/assets/css/tailwind.css'],
  colorMode: {
    classSuffix: '',
  },
  runtimeConfig: {
    public: {
      apiBase: '/cogui/',
    },
  },
  compatibilityDate: '2024-11-01',
  nitro: {
    preset: 'github-pages',
    runtimeConfig: {
      app: {
        baseURL: '/cogui/',
      },
    },
    baseURL: '/cogui/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  i18n: {
    vueI18n: './i18n.config.ts',
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
