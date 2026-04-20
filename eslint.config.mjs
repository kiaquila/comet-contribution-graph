import html from "eslint-plugin-html";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

export default [
  {
    files: ["prototypes/**/*.html"],
    plugins: { html, unicorn },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: globals.browser,
    },
    rules: {
      "no-invalid-regexp": "error",
      "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
      "unicorn/no-array-callback-reference": "error",
    },
  },
];
