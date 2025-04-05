// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

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
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },
  colorMode: {
    classSuffix: '',
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
  ssr: false,
  eslint: {
    config: {
      stylistic: true,
    },
  },
  i18n: {
    vueI18n: './i18n.config.ts',
  },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
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
