import { createConfigForNuxt } from "@nuxt/eslint-config/flat";
import eslintPluginVue from 'eslint-plugin-vue';

export default createConfigForNuxt({
  extends: [
    "eslint:recommended",
    "plugin:nuxt/recommended",
    "plugin:prettier/recommended",
    ...eslintPluginVue.configs['flat/recommended'],
    "prettier",
  ],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "eslint-disable-next-line": "off",
    "vue/html-self-closing": "off",
  },
  globals: {
    $t: true,
  }
});
