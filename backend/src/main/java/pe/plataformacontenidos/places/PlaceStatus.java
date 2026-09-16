package pe.plataformacontenidos.places;

/** Estados del flujo de publicación (CONTEXTO.md sección 12) — mismo ciclo que ArticleStatus, propio de este módulo (sección 38). */
public enum PlaceStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED,
    REJECTED
}
