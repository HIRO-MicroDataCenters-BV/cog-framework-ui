import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  extends: [
    "eslint:recommended",
    "plugin:nuxt/recommended",
    "plugin:prettier/recommended",
    "prettier",
  ],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
  },
});
