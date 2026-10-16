import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { visitorHeaders } from "@/lib/forward-visitor";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Proxy de POST /api/v1/ads/campaigns/{id}/play: el visitante tocó play en
 * el video de un anuncio nativo (ver native-ad-post.tsx). Igual que
 * api/ads/impression: mismo origen, siempre 204, el backend decide si cuenta.
 */
export async function POST(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (UUID.test(id)) {
    await fetch(`${BACKEND_API_URL}/api/v1/ads/campaigns/${id}/play`, {
      method: "POST",
      cache: "no-store",
      headers: visitorHeaders(request),
    }).catch(() => undefined);
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
