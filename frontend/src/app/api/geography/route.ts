import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/**
 * Proxy de solo lectura sobre GET /api/v1/geography (dato público, sin
 * autenticación en el backend). Existe para que el selector de geografía
 * en cascada del panel admin (Client Component) pueda pedir datos sin que
 * el navegador llame directo al backend — mismo principio que el resto del
 * frontend (ver memoria "engineering-guardrails": el navegador solo habla
 * con Next.js).
 *
 * Sin caché a propósito (a diferencia de listGeographyChildren() en
 * src/lib/api/client.ts, que cachea 300s para el sitio público): una
 * unidad geográfica recién creada en /admin/geografia debe poder elegirse
 * de inmediato en el selector del formulario de artículo. Encontrado en la
 * revisión de código de esta fase — mismo problema que ya se había
 * corregido para categorías/etiquetas (ver listActiveCategoriesFresh /
 * listAdminTags en admin-client.ts).
 */
export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level") ?? "PAIS";
  const parentId = request.nextUrl.searchParams.get("parentId");

  const query = new URLSearchParams({ level });
  if (parentId) query.set("parentId", parentId);

  const res = await fetch(`${BACKEND_API_URL}/api/v1/geography?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }
  const units = await res.json();
  return NextResponse.json(units);
}
