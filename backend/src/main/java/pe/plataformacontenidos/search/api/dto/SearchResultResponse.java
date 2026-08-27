package pe.plataformacontenidos.search.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.search.SearchResultType;

/**
 * Forma unificada de un resultado de búsqueda, sea cual sea el tipo de
 * contenido de origen (CONTEXTO.md sección 16 y 20: "cuando existan
 * Lugares/Eventos/Directorio, esto se separa a un módulo Search propio que
 * agregue resultados de varios módulos" — ya hay dos tipos buscables, este
 * es ese momento). El frontend arma la URL a partir de `contentType` +
 * `slug` (/articulos/{slug} o /lugares/{slug}).
 */
public record SearchResultResponse(
        SearchResultType contentType,
        UUID id,
        String slug,
        String title,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        UUID featuredImageId,
        boolean hasVideo,
        Instant publishedAt) {

    public static SearchResultResponse fromArticle(Article article) {
        return new SearchResultResponse(
                SearchResultType.ARTICLE,
                article.getId(),
                article.getSlug(),
                article.getTitle(),
                article.getExcerpt(),
                article.getCategoryId(),
                article.getGeographyId(),
                article.getFeaturedImageId(),
                article.getYoutubeVideoId() != null,
                article.getPublishedAt());
    }

    public static SearchResultResponse fromPlace(Place place) {
        UUID coverImageId = place.getImageIds().isEmpty() ? null : place.getImageIds().get(0);
        return new SearchResultResponse(
                SearchResultType.PLACE,
                place.getId(),
                place.getSlug(),
                place.getName(),
                place.getExcerpt(),
                place.getCategoryId(),
                place.getGeographyId(),
                coverImageId,
                place.getYoutubeVideoId() != null,
                place.getPublishedAt());
    }

    public static SearchResultResponse fromEvent(Event event) {
        UUID coverImageId = event.getImageIds().isEmpty() ? null : event.getImageIds().get(0);
        return new SearchResultResponse(
                SearchResultType.EVENT,
                event.getId(),
                event.getSlug(),
                event.getTitle(),
                event.getExcerpt(),
                event.getCategoryId(),
                event.getGeographyId(),
                coverImageId,
                event.getYoutubeVideoId() != null,
                event.getPublishedAt());
    }

    public static SearchResultResponse fromGallery(Gallery gallery) {
        UUID coverImageId = gallery.getImageIds().isEmpty() ? null : gallery.getImageIds().get(0);
        return new SearchResultResponse(
                SearchResultType.GALLERY,
                gallery.getId(),
                gallery.getSlug(),
                gallery.getTitle(),
                gallery.getExcerpt(),
                gallery.getCategoryId(),
                gallery.getGeographyId(),
                coverImageId,
                false,
                gallery.getPublishedAt());
    }
}
