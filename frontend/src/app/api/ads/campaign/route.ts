import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serverImageUrl } from "@/lib/server-image-url";
import type { ActiveCampaign, ResolvedCampaign } from "@/lib/api/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const PLACEMENT_KEY = /^[a-z0-9_-]{1,64}$/;

/**
 * Proxy de GET /api/v1/ads/campaigns/active (ver CampaignPublicController)
 * para que la campaña directa se elija en el navegador, no al renderizar la
 * página. Antes AdBlock/AnchorAdSlot la pedían sin caché durante el render
 * (cada llamada cuenta una impresión), y como AnchorAdSlot vive en el
 * layout público, eso volvía dinámicas TODAS las páginas públicas: ninguna
 * podía guardarse en caché (ni ISR, ni nginx, ni Cloudflare). Pedirla desde
 * el cliente deja las páginas estáticas y además cuenta impresiones solo
 * de navegadores reales, no de bots que no ejecutan JavaScript.
 *
 * Igual que api/feed: resuelve acá la URL de imagen para next/image
 * (serverImageUrl, red interna de Docker), que el cliente no puede armar.
 */
export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get("placement") ?? "";
  if (!PLACEMENT_KEY.test(placement)) {
    return NextResponse.json({ error: "Posición inválida" }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_API_URL}/api/v1/ads/campaigns/active?placementKey=${encodeURIComponent(placement)}`,
    { cache: "no-store" },
  );
  if (res.status === 204) return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!res.ok) return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

  const campaign = (await res.json()) as ActiveCampaign;
  const resolved: ResolvedCampaign = {
    id: campaign.id,
    imageSrc: campaign.imageId ? serverImageUrl(`/api/v1/images/${campaign.imageId}/file`) : null,
    externalImageUrl: campaign.externalImageUrl,
    imageAlt: campaign.imageAlt,
  };
  return NextResponse.json(resolved, { headers: { "Cache-Control": "no-store" } });
}
