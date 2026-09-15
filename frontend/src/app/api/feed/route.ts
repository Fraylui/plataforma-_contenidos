import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromFeedItem } from "@/lib/home-items";
import type { FeedItem } from "@/lib/api/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const MAX_SIZE = 30; // = MAX_PAGE_SIZE en FeedController

/**
 * Proxy de GET /api/v1/feed (público, sin autenticación) para el scroll
 * infinito del home — mismo principio que api/content/[type]/[slug]/like/route.ts:
 * el navegador nunca llama directo al backend. Sin caché a propósito: cada
 * visitante lleva su propio `exclude`/`seed`, así que la respuesta no es la
 * misma para todos.
 *
 * A diferencia de otros proxies, acá SÍ se resuelve la forma de tarjeta
 * (fromFeedItem, con serverImageUrl) antes de responder: un Route Handler
 * corre siempre en el servidor de Next, nunca en el navegador, así que
 * puede usar BACKEND_API_URL — la URL de imagen para next/image tiene que
 * ser alcanzable desde ESE proceso (red interna de Docker), no desde la
 * máquina del visitante (ver server-image-url.ts). Si esto devolviera el
 * FeedItem crudo, el Client Component tendría que resolver la imagen con la
 * URL pública y rompería la optimización de imágenes en producción.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const size = Math.min(Math.max(Number(params.get("size") ?? 12), 1), MAX_SIZE);
  const seed = params.get("seed");
  const exclude = params.getAll("exclude");

  const query = new URLSearchParams({ size: String(size) });
  if (seed) query.set("seed", seed);
  for (const id of exclude) query.append("exclude", id);

  const res = await fetch(`${BACKEND_API_URL}/api/v1/feed?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ items: [], hasMore: false }, { status: res.status });
  }
  const page: { items: FeedItem[]; hasMore: boolean } = await res.json();
  return NextResponse.json({ items: page.items.map(fromFeedItem), hasMore: page.hasMore });
}
