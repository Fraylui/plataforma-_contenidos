// vitest-axe solo aumenta el namespace global `Vi` (`declare global { namespace
// Vi {...} }`), que era el mecanismo de tipos de Vitest 0.x/1.x. Vitest 4
// (instalado acá) movió la extensión de matchers a `declare module "vitest"`
// (ver @testing-library/jest-dom/types/vitest.d.ts, que sí sigue el patrón
// nuevo) — por eso `toHaveNoViolations` no aparece en `Assertion<T>` aunque
// el matcher funcione en runtime (expect.extend en src/test/setup.ts). Este
// archivo hace la misma extensión que vitest-axe debería hacer, con el
// mecanismo correcto para esta versión de Vitest.
import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  // Cuerpo vacío intencional: es el patrón estándar de aumento de tipos de
  // Vitest (idéntico al de @testing-library/jest-dom/types/vitest.d.ts) —
  // no hay miembros propios que declarar, solo agregar los de AxeMatchers.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<T = unknown> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
