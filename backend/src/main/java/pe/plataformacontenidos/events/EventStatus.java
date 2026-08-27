package pe.plataformacontenidos.events;

/** Estados editoriales (CONTEXTO.md sección 12) — mismo ciclo que PlaceStatus/ArticleStatus, propio de este módulo (sección 38). */
public enum EventStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED,
    REJECTED
}
