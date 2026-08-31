import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/**
 * Proxy de POST /api/v1/articles/{slug}/like (público, sin autenticación en
 * el backend) — mismo principio que api/geography/route.ts: el navegador
 * nunca llama directo al backend.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visitorId = request.nextUrl.searchParams.get("visitorId");
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_API_URL}/api/v1/articles/${encodeURIComponent(slug)}/like?visitorId=${encodeURIComponent(visitorId)}`,
    { method: "POST", cache: "no-store" },
  );
  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo registrar el me gusta" }, { status: res.status });
  }
  const result = await res.json();
  return NextResponse.json(result);
}
