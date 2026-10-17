import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { visitorHeaders } from "@/lib/forward-visitor";
import { toTodayCelebration } from "@/lib/today-celebrations";
import type { CelebrationSummary } from "@/lib/api/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Proxy de GET /api/v1/celebrations/today con la ubicación del visitante
 * (cabeceras de Cloudflare, como api/ads/campaign): cada uno ve lo que se
 * celebra en su región, su país y en todo el mundo. Se pide desde el
 * navegador para que las páginas sigan siendo cacheables. Si falla,
 * responde 204 y el navegador se queda con lo que vino en la página.
 */
export async function GET(request: NextRequest) {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/celebrations/today`, {
    cache: "no-store",
    headers: visitorHeaders(request),
  }).catch(() => null);
  if (!res || res.status !== 200) return new NextResponse(null, { status: 204, headers: NO_STORE });

  const dates = (await res.json()) as CelebrationSummary[];
  return NextResponse.json(dates.map(toTodayCelebration), { headers: NO_STORE });
}
