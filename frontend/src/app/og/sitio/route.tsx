import { ImageResponse } from "next/og";
import { getPlatformSettings } from "@/lib/api/client";

/**
 * Imagen para compartir el sitio (inicio, Explorar, Buscar…) cuando el
 * dueño no subió una en Configuración: el nombre y la descripción sobre los
 * colores de la marca. Sin ella, WhatsApp y Facebook muestran el enlace sin
 * vista previa.
 */
export async function GET() {
  const settings = await getPlatformSettings().catch(() => null);
  const name = settings?.name ?? "";
  const description = settings?.description ?? "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: "linear-gradient(135deg, #0f766e 0%, #059669 45%, #f97316 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
        {description && <div style={{ display: "flex", marginTop: 24, fontSize: 36, opacity: 0.92, maxWidth: 960 }}>{description}</div>}
      </div>
    ),
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
