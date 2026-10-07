import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serverImageUrl } from "@/lib/server-image-url";
import { visitorHeaders } from "@/lib/ads/forward-visitor";
import type { PlacementRotation, ResolvedRotation } from "@/lib/api/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const PLACEMENT_KEY = /^[a-z0-9_-]{1,64}$/;
const SECTION = /^(HOME|ARTICLE|PLACE|EVENT|GALLERY|BUSINESS)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Proxy de GET /api/v1/ads/campaigns/rotation (ver CampaignPublicController)
 * para que las campañas directas se elijan en el navegador, no al renderizar
 * la página: así todas las páginas públicas siguen siendo cacheables (ISR,
 * nginx, Cloudflare). Devuelve la medida de la posición y las campañas que
 * este visitante puede ver, ya en orden ponderado — el navegador le da una
 * distinta a cada espacio. Pedirla no cuenta impresiones (ver
 * api/ads/impression).
 *
 * Igual que api/feed: resuelve acá la URL de imagen para next/image
 * (serverImageUrl, red interna de Docker), que el cliente no puede armar.
 */
export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get("placement") ?? "";
  if (!PLACEMENT_KEY.test(placement)) {
    return NextResponse.json({ error: "Posición inválida" }, { status: 400 });
  }

  // Contexto opcional de la página: lo que no tenga forma válida simplemente no se manda.
  const query = new URLSearchParams({ placementKey: placement });
  const section = request.nextUrl.searchParams.get("section");
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  if (section && SECTION.test(section)) query.set("section", section);
  if (categoryId && UUID.test(categoryId)) query.set("categoryId", categoryId);

  const res = await fetch(
    `${BACKEND_API_URL}/api/v1/ads/campaigns/rotation?${query.toString()}`,
    { cache: "no-store", headers: visitorHeaders(request) },
  ).catch(() => null);
  if (!res || res.status !== 200) return new NextResponse(null, { status: 204, headers: NO_STORE });

  const rotation = (await res.json()) as PlacementRotation;
  const resolved: ResolvedRotation = {
    width: rotation.width,
    height: rotation.height,
    campaigns: rotation.campaigns.map((campaign) => ({
      id: campaign.id,
      advertiserId: campaign.advertiserId,
      imageSrc: campaign.imageId ? serverImageUrl(`/api/v1/images/${campaign.imageId}/file`) : null,
      externalImageUrl: campaign.externalImageUrl,
      imageAlt: campaign.imageAlt,
    })),
  };
  return NextResponse.json(resolved, { headers: NO_STORE });
}
