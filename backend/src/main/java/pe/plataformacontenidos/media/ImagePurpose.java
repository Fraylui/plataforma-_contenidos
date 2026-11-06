package pe.plataformacontenidos.media;

/**
 * Para qué se subió una imagen (V72). La biblioteca de los compositores de
 * contenido muestra solo CONTENT; la de publicidad (creatividades, logos de
 * anunciantes) solo AD. Es una etiqueta de orden, no un permiso: cualquier
 * imagen se puede seguir usando por su id.
 */
public enum ImagePurpose {
    CONTENT,
    AD,
    /** Foto de una historia: se borra con ella y no aparece en las bibliotecas. */
    STORY
}
