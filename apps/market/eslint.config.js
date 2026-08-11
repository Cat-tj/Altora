import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
