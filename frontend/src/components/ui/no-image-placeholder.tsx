import { ImageOff } from "lucide-react";

/**
 * Reemplazo del rectángulo gris plano "Sin fotografía" — fondo neutro zinc
 * (no el tinte de marca sobre rojo: --accent-soft se veía pardo/marrón acá,
 * competía con la barra de acento real de CardMedia) + ícono Lucide en vez
 * de SVG a mano. Usado por CardMedia cuando la tarjeta no tiene imageId.
 */
export function NoImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100">
      <ImageOff className="h-8 w-8 text-zinc-300" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}
