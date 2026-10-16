package pe.plataformacontenidos.search;

/** Tipos de contenido que hoy participan de la búsqueda unificada (CONTEXTO.md sección 16). */
public enum SearchResultType {
    ARTICLE,
    PLACE,
    EVENT,
    GALLERY,
    BUSINESS,
    /** Episodio de una serie: la URL es /series/{seriesSlug}/{slug}. */
    EPISODE
}
