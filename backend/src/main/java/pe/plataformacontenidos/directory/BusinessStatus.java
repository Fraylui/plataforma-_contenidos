package pe.plataformacontenidos.directory;

/** Estados editoriales (CONTEXTO.md sección 12) — mismo ciclo que ReviewStatus/EventStatus, propio de este módulo (sección 38). */
public enum BusinessStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED,
    REJECTED
}
