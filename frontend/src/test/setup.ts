import "@testing-library/jest-dom/vitest";
// Registra el matcher en runtime. El tipo (Assertion.toHaveNoViolations) lo
// aumenta src/test/vitest-axe.d.ts — vitest-axe trae su propia extensión de
// tipos pero apunta al mecanismo de Vitest 0.x/1.x, incompatible con la v4 instalada.
import * as axeMatchers from "vitest-axe/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";
import { usePathname } from "next/navigation";

expect.extend(axeMatchers);

// next/navigation no funciona fuera del App Router: cada test que lo
// necesite sobreescribe el valor con vi.mocked(usePathname).mockReturnValue(...).
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(usePathname).mockReturnValue("/");
});
