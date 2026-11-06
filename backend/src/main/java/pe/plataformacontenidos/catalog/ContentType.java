package pe.plataformacontenidos.catalog;

/**
 * Tipos de contenido publicable (CONTEXTO.md sección 3) que reciben "me
 * gusta" y visitas — ver ContentLike. EPISODE: un episodio de una serie
 * (video de YouTube), que también entra al feed.
 */
public enum ContentType {
    PUBLICATION,
    PLACE,
    CELEBRATION,
    GALLERY,
    EPISODE,
    /** Historia: visitas y me gusta como el resto, pero fuera del feed y del Inicio del panel. */
    STORY
}
