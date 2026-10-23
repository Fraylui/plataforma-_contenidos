import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function nonceOf(policy: string | null): string | undefined {
  return policy?.match(/'nonce-([^']+)'/)?.[1];
}

describe("proxy: CSP con nonce en el panel", () => {
  it("cada visita al panel recibe un nonce nuevo, en la respuesta y en lo que renderiza Next", async () => {
    const first = await proxy(new NextRequest("http://localhost:3000/admin/login"));
    const second = await proxy(new NextRequest("http://localhost:3000/admin/login"));

    const nonce = nonceOf(first.headers.get("content-security-policy"));
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
    expect(nonceOf(second.headers.get("content-security-policy"))).not.toBe(nonce);
    // Next lee el nonce de la cabecera de la petición para ponerlo en sus <script>.
    expect(nonceOf(first.headers.get("x-middleware-request-content-security-policy"))).toBe(nonce);
  });

  it("sin sesión también lleva la CSP (la redirección al login)", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/admin/publicaciones"));

    expect(response.status).toBe(307);
    expect(nonceOf(response.headers.get("content-security-policy"))).toBeDefined();
  });
});
