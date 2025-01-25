// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/i18n",
    "@nuxtjs/tailwindcss",
    "@nuxt/fonts",
    "shadcn-nuxt",
    "@vueuse/nuxt",
    "@nuxt/eslint",
    "nuxt-zod-i18n",
    "nuxt-schema-org",
  ],
  i18n: {
    vueI18n: "./i18n.config.ts",
  },
  ssr: false,
  eslint: {
    config: {
      stylistic: true,
    },
  },
  runtimeConfig: {
    public: {
      apiBase: "",
    },
  },
});
