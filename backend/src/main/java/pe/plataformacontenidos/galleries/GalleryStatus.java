package pe.plataformacontenidos.galleries;

/** Estados editoriales (CONTEXTO.md sección 12) — mismo ciclo que EventStatus/PlaceStatus/ArticleStatus, propio de este módulo (sección 38). */
public enum GalleryStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    SCHEDULED,
    PUBLISHED,
    ARCHIVED,
    REJECTED
}
