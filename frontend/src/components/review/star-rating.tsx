const SIZE_CLASSES: Record<"sm" | "lg", string> = {
  sm: "h-3.5 w-3.5",
  lg: "h-6 w-6",
};

/** Estrellas de solo lectura (1-5) — usado en ReviewCard y en el detalle de Reseña. SVG inline, sin librería nueva. */
export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Calificación: ${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((position) => (
        <svg
          key={position}
          viewBox="0 0 20 20"
          fill={position <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={position <= rating ? 0 : 1.5}
          className={`${SIZE_CLASSES[size]} ${position <= rating ? "text-accent" : "text-border"}`}
          aria-hidden="true"
        >
          <path
            strokeLinejoin="round"
            d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.67.99-5.77-4.19-4.08 5.79-.84L10 1.5Z"
          />
        </svg>
      ))}
    </span>
  );
}
