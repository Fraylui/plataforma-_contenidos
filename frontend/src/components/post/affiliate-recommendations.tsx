import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { PublicAffiliateLink } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";

/** El clic pasa por el backend (/go) para contarlo y luego abre la tienda. */
export function affiliateHref(id: string): string {
  return imageUrl(`/api/v1/affiliate-links/${encodeURIComponent(id)}/go`);
}

/**
 * «Recomendados» al final de una publicación o un lugar. Cada enlace lleva la
 * marca «Enlace de afiliado» y el aviso de comisión: publicidad no encubierta
 * (D.Leg. 1044) y transparencia con quien lee. rel="sponsored": Google pide
 * marcar así los enlaces pagados. Sin enlaces no se muestra nada.
 */
export function AffiliateRecommendations({ links }: { links: PublicAffiliateLink[] }) {
  if (links.length === 0) return null;
  return (
    <section aria-labelledby="recomendados" className="not-prose mt-8 rounded-card bg-surface p-4 shadow-card">
      <h2 id="recomendados" className="text-lg font-bold text-foreground">
        Recomendados
      </h2>
      <p className="mt-1 text-xs text-muted">
        Son enlaces de afiliado: si compras o reservas por aquí, recibimos una comisión sin costo extra para ti.
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={affiliateHref(link.id)}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="flex items-center gap-3 rounded-control border border-border px-3 py-2.5 transition-colors hover:bg-canvas-strong focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">{link.label}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>{link.store}</span>
                  <span className="rounded-full bg-field px-2 py-0.5 font-semibold">Enlace de afiliado</span>
                </span>
              </span>
              <ArrowSquareOut className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
