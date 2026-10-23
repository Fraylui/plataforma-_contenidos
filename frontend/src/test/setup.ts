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

// jsdom no implementa matchMedia ni ResizeObserver; el carrusel (embla) los
// usa al montarse. Sustitutos mínimos: en el navegador real existen siempre.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
if (!("ResizeObserver" in window)) {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!("IntersectionObserver" in window)) {
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

// cmdk (Combobox) desplaza la opción activa con scrollIntoView, que jsdom no implementa.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
