import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // You can customize rules here
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
