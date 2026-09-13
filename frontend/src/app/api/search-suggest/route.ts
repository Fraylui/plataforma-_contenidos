import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const MAX_SIZE = 8;

/**
 * Proxy de GET /api/v1/search (público, sin autenticación) para las
 * sugerencias en vivo del buscador del header — mismo principio que
 * api/feed/route.ts: el navegador nunca llama directo al backend. A
 * diferencia de /api/feed, acá no hace falta resolver la imagen en el
 * servidor: las miniaturas de sugerencia son chicas y se muestran con un
 * <img> plano vía lib/image-url.ts (URL pública, sin pasar por next/image),
 * así que el navegador puede resolverlas él mismo con lo que ya viene en
 * SearchResult (featuredImageId/featuredImageUrl).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ items: [] });
  }
  const size = Math.min(Math.max(Number(request.nextUrl.searchParams.get("size") ?? 6), 1), MAX_SIZE);

  const query = new URLSearchParams({ q, page: "0", size: String(size) });
  const res = await fetch(`${BACKEND_API_URL}/api/v1/search?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ items: [] }, { status: res.status });
  }
  const page = await res.json();
  return NextResponse.json({ items: page.items, totalElements: page.totalElements });
}
