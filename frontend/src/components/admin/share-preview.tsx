/* eslint-disable @next/next/no-img-element -- vista previa con URLs arbitrarias (externas o del backend), sin optimizar */
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Lo que verán Google y las redes: lo propio si se escribió, si no el título y la descripción corta. */
export function shareText(values: { title: string; excerpt: string; seoTitle: string; metaDescription: string }) {
  return {
    title: clip(values.seoTitle.trim() || values.title, TITLE_MAX),
    description: clip(values.metaDescription.trim() || values.excerpt, DESCRIPTION_MAX),
  };
}

/** Vista previa de cómo se verá la publicación en Google y al compartirla (WhatsApp, Facebook, X). */
export function SharePreview({
  siteName,
  path,
  title,
  description,
  imageUrl,
}: {
  siteName: string;
  path: string;
  title: string;
  description: string;
  imageUrl: string | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure className="space-y-2">
        <figcaption className="text-xs font-medium text-muted">Así aparece en Google</figcaption>
        <div className="rounded-control bg-field p-3">
          <p className="truncate text-xs text-muted">
            {siteName} › {path}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[15px] font-medium text-info">{title || "Título de la publicación"}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{description || "La descripción corta aparece aquí."}</p>
        </div>
      </figure>
      <figure className="space-y-2">
        <figcaption className="text-xs font-medium text-muted">Así se ve al compartir en redes</figcaption>
        <div className="overflow-hidden rounded-control bg-field">
          <div className="flex aspect-[1.91/1] items-center justify-center bg-canvas-strong">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <p className="flex items-center gap-2 px-4 text-center text-xs text-muted">
                <ImageSquare aria-hidden="true" className="size-4 shrink-0" />
                Agrega una foto: la primera es la portada al compartir
              </p>
            )}
          </div>
          <div className="space-y-0.5 p-3">
            <p className="text-xs uppercase text-muted">{siteName}</p>
            <p className="line-clamp-1 text-sm font-semibold text-foreground">{title || "Título de la publicación"}</p>
            <p className="line-clamp-1 text-xs text-muted">{description}</p>
          </div>
        </div>
      </figure>
    </div>
  );
}
