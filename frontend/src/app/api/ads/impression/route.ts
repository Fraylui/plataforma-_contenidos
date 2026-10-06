import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { visitorHeaders } from "@/lib/ads/forward-visitor";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Proxy de POST /api/v1/ads/campaigns/{id}/impression: el navegador avisa
 * (navigator.sendBeacon, ver use-viewable-impression.ts) que un anuncio se
 * vio de verdad. Mismo origen que la página, así no hace falta abrir CORS
 * ni connect-src hacia el backend. Siempre 204: el backend decide en
 * silencio si cuenta (robots, duplicados, campaña vencida).
 */
export async function POST(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (UUID.test(id)) {
    await fetch(`${BACKEND_API_URL}/api/v1/ads/campaigns/${id}/impression`, {
      method: "POST",
      cache: "no-store",
      headers: visitorHeaders(request),
    }).catch(() => undefined);
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
