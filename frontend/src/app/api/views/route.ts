import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { FeedItemType } from "@/lib/api/types";
import { visitorHeaders } from "@/lib/forward-visitor";
import { orDefault } from "@/lib/server-log";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES: ReadonlySet<string> = new Set<FeedItemType>(["PUBLICATION", "PLACE", "CELEBRATION", "GALLERY", "EPISODE"]);

/**
 * Proxy de POST /api/v1/views: la página de un contenido avisa que se abrió
 * (navigator.sendBeacon, ver view-beacon.tsx). Mismo origen que la página,
 * como api/ads/impression. Siempre 204: el backend decide en silencio si
 * cuenta (robots, repetidas, contenido inexistente) — ver ContentViewCounter.
 */
export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "";
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (TYPES.has(type) && UUID.test(id)) {
    await fetch(`${BACKEND_API_URL}/api/v1/views`, {
      method: "POST",
      cache: "no-store",
      headers: { ...visitorHeaders(request), "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    }).catch(orDefault("api.visitas", undefined));
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
