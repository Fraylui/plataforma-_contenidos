import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/**
 * Proxy de /api/v1/reactions (ContentReactionController): como los «me
 * gusta», el navegador nunca llama directo al backend.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const res = await fetch(`${BACKEND_API_URL}/api/v1/reactions?${query}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Sin reacciones" }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND_API_URL}/api/v1/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "No se pudo reaccionar" }, { status: res.status });
  return NextResponse.json(await res.json());
}
