import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { visitorHeaders } from "@/lib/forward-visitor";
import { orDefault } from "@/lib/server-log";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Proxy de POST /api/v1/stories/{id}/cta: el visor avisa que se tocó el botón
 * de una historia («Ver publicación»), como api/views. Siempre 204: el backend
 * decide en silencio si cuenta (robots, repetidos) — ver StoryCtaCounter.
 */
export async function POST(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (UUID.test(id)) {
    await fetch(`${BACKEND_API_URL}/api/v1/stories/${id}/cta`, {
      method: "POST",
      cache: "no-store",
      headers: visitorHeaders(request),
    }).catch(orDefault("api.historias.boton", undefined));
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
