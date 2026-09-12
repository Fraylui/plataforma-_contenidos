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
    // Scripts de k6 (tests de carga/estrés): corren en el runtime de k6, no
    // en Node/el bundle de Next.js — usan globals propios (__ENV) y su
    // propio estilo de módulo (export default de función anónima, el
    // patrón que documenta k6).
    "tests/load/**",
  ]),
]);

export default eslintConfig;
