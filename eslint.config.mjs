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
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "NewExpression[callee.name='RegExp']:not([arguments.0.type='Literal'])",
          message:
            "Dynamic RegExp construction is unsafe; use a regex literal or validate the input string.",
        },
      ],
      "unicorn/no-array-callback-reference": "error",
    },
  },
];
