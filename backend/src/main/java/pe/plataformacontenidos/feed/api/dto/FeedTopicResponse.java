package pe.plataformacontenidos.feed.api.dto;

import java.util.UUID;

/**
 * Un círculo de la fila de temas del feed (estilo historias de Instagram):
 * portada = la imagen del contenido más reciente que tenga una; `hasNew` =
 * algo publicado en las últimas 48 h (el anillo verde).
 */
public record FeedTopicResponse(UUID categoryId, String name, String slug, UUID coverImageId, String coverImageUrl,
        boolean hasNew) {
}
