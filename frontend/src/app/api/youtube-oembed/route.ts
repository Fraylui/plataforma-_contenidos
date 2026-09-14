import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OEMBED_URL = "https://www.youtube.com/oembed";
const YOUTUBE_HOST = /^(www\.)?(youtube\.com|youtu\.be)$/i;

/**
 * Proxy de GET https://www.youtube.com/oembed (público, sin API key) — el
 * navegador nunca llama directo a un dominio externo. Devuelve el título del
 * video para autorrellenar el campo al pegar un link de YouTube en el
 * formulario (editable a mano después; si falla, se escribe a mano).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url requerida" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }
  if (!YOUTUBE_HOST.test(parsed.hostname)) {
    return NextResponse.json({ error: "No es una URL de YouTube" }, { status: 400 });
  }

  const res = await fetch(`${OEMBED_URL}?url=${encodeURIComponent(url)}&format=json`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo obtener el título" }, { status: res.status });
  }
  const data = (await res.json()) as { title?: string };
  return NextResponse.json({ title: data.title ?? null });
}
