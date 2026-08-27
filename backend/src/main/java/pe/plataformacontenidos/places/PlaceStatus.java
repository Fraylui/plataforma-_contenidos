package pe.plataformacontenidos.places;

/** Estados editoriales (CONTEXTO.md sección 12) — mismo ciclo que ArticleStatus, propio de este módulo (sección 38). */
public enum PlaceStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED,
    REJECTED
}
