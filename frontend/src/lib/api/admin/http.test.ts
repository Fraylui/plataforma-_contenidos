import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const realIp = vi.hoisted(() => ({ value: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(realIp.value ? { "x-real-ip": realIp.value } : {}),
}));

import { AdminApiError, AdminSessionExpiredError, authedJson } from "./http";

function respond(status: number, body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body.length ? body : null, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("authedJson: la llamada autenticada del panel", () => {
  beforeEach(() => {
    realIp.value = null;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("manda el token y la IP real del visitante, y devuelve el JSON", async () => {
    realIp.value = "190.42.10.7";
    const fetchMock = respond(200, '{"ok":true}');

    await expect(authedJson("/api/v1/admin/x", "token-1")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-1", "X-Forwarded-For": "190.42.10.7" });
    expect(init.cache).toBe("no-store");
  });

  it("no reenvía una IP que no tiene forma de IP", async () => {
    realIp.value = "1.2.3.4\r\nX-Inyectado: si";
    const fetchMock = respond(200, "{}");

    await authedJson("/api/v1/admin/x", "t");

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("X-Forwarded-For");
  });

  it("un 200 sin cuerpo (void en Spring) devuelve undefined", async () => {
    respond(200, "");
    await expect(authedJson("/api/v1/admin/x", "t")).resolves.toBeUndefined();
  });

  it("un 401 significa sesión vencida", async () => {
    respond(401, "");
    await expect(authedJson("/api/v1/admin/x", "t")).rejects.toBeInstanceOf(AdminSessionExpiredError);
  });

  it("otro error trae el estado y el mensaje del problema (RFC 9457)", async () => {
    respond(409, JSON.stringify({ status: 409, detail: "La imagen está en uso." }));

    const error = await authedJson("/api/v1/admin/x", "t").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AdminApiError);
    expect((error as AdminApiError).status).toBe(409);
    expect((error as AdminApiError).message).toBe("La imagen está en uso.");
  });
});
