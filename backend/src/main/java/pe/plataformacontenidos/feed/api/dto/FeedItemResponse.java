package pe.plataformacontenidos.feed.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleType;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Forma unificada de un ítem de feed, sea cual sea su tipo de origen — mismo
 * criterio que search.api.dto.SearchResultResponse (CONTEXTO.md sección 16):
 * el frontend arma la URL a partir de `type` + `slug`. A diferencia de
 * SearchResultResponse, acá sí importa likeCount (las tarjetas del home lo
 * muestran, ver CONTEXTO.md sección 43). `articleType` solo aplica a
 * ARTICLE (null en Lugar/Evento) — permite mostrar la etiqueta real
 * (Guía/Crónica/…) en vez de un genérico "Publicación", igual que
 * ArticleSummaryResponse. coverImageId/coverImageUrl son excluyentes (ver
 * ContentImage): la primera imagen del contenido, subida o por enlace
 * externo.
 */
public record FeedItemResponse(
        ContentType type,
        UUID id,
        String slug,
        String title,
        String excerpt,
        ArticleType articleType,
        UUID categoryId,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        long likeCount) {

    public static FeedItemResponse fromArticle(Article article, long likeCount) {
        ContentImage cover = article.getCoverImage();
        return new FeedItemResponse(ContentType.ARTICLE, article.getId(), article.getSlug(), article.getTitle(),
                article.getExcerpt(), article.getArticleType(), article.getCategoryId(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !article.getVideos().isEmpty(), article.getPublishedAt(), likeCount);
    }

    public static FeedItemResponse fromPlace(Place place, long likeCount) {
        ContentImage cover = place.getCoverImage();
        return new FeedItemResponse(ContentType.PLACE, place.getId(), place.getSlug(), place.getName(),
                place.getExcerpt(), null, place.getCategoryId(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !place.getVideos().isEmpty(), place.getPublishedAt(), likeCount);
    }

    public static FeedItemResponse fromEvent(Event event, long likeCount) {
        ContentImage cover = event.getCoverImage();
        return new FeedItemResponse(ContentType.EVENT, event.getId(), event.getSlug(), event.getTitle(),
                event.getExcerpt(), null, event.getCategoryId(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !event.getVideos().isEmpty(), event.getPublishedAt(), likeCount);
    }
}
