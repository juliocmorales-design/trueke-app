import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler rules: downgrade to warn — async setState in effects
      // and impure helpers are established patterns in this codebase.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // Supabase returns untyped results; proper types require `supabase gen types`.
      // Downgrade until generated types are added to the project.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
