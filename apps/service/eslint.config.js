import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // MJS scripts (migration runners, contract tests) run in Node.js
    files: ["scripts/**/*.mjs", "db/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
