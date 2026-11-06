import { describe, expect, it } from "vitest";
import { adminCsp, publicCsp } from "./csp";

function directive(policy: string, name: string): string {
  return policy.split("; ").find((d) => d.startsWith(name + " ")) ?? "";
}

describe("CSP: estricta en el panel, compatible con caché en el sitio público", () => {
  it("el panel solo ejecuta scripts con el nonce de esa visita (sin 'unsafe-inline')", () => {
    const scripts = directive(adminCsp("abc123", { dev: false }), "script-src");
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("el sitio público mantiene 'unsafe-inline' porque sus páginas se sirven de caché", () => {
    expect(directive(publicCsp({ dev: false }), "script-src")).toContain("'unsafe-inline'");
  });

  it("ambas conservan los bloqueos que no dependen del nonce", () => {
    for (const policy of [publicCsp({ dev: false }), adminCsp("n", { dev: false })]) {
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).toContain("base-uri 'self'");
    }
  });

  it("'unsafe-eval' solo en desarrollo (Fast Refresh)", () => {
    expect(directive(adminCsp("n", { dev: true }), "script-src")).toContain("'unsafe-eval'");
    expect(directive(publicCsp({ dev: true }), "script-src")).toContain("'unsafe-eval'");
  });
});
