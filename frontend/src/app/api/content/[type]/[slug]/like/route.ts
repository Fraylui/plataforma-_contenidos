import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/** `type` -> segmento base del backend (ver ArticlePublicController y hermanos). */
const BACKEND_PATH: Record<string, string> = {
  articles: "articles",
  places: "places",
  events: "events",
  galleries: "galleries",
  reviews: "reviews",
  directory: "directory",
};

/**
 * Proxy de POST /api/v1/{tipo}/{slug}/like (público, sin autenticación en
 * el backend) — mismo principio que api/geography/route.ts: el navegador
 * nunca llama directo al backend. Un solo route handler para los 6 tipos
 * de contenido en vez de repetirlo (ver engagement.ContentLikeService en
 * el backend, que ya unificó esto del lado del servidor).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params;
  const backendPath = BACKEND_PATH[type];
  if (!backendPath) {
    return NextResponse.json({ error: "Tipo de contenido inválido" }, { status: 400 });
  }
  const visitorId = request.nextUrl.searchParams.get("visitorId");
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_API_URL}/api/v1/${backendPath}/${encodeURIComponent(slug)}/like?visitorId=${encodeURIComponent(visitorId)}`,
    { method: "POST", cache: "no-store" },
  );
  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo registrar el me gusta" }, { status: res.status });
  }
  const result = await res.json();
  return NextResponse.json(result);
}
