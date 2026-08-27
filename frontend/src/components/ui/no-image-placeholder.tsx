/**
 * Reemplazo del rectángulo gris plano "Sin fotografía" — ícono + fondo con
 * tinte de marca (accent-soft) en vez de bg-border liso, para que una
 * tarjeta sin foto todavía se sienta cuidada, no como un placeholder roto.
 * Usado por ArticleCard, PlaceCard y SearchResultCard.
 */
export function NoImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft to-border/40">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-8 w-8 text-muted/50"
        aria-hidden="true"
      >
        <rect x="3" y="4.5" width="18" height="15" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="M3 16.5l5-4.5 4 3.5 3-2.5 6 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
