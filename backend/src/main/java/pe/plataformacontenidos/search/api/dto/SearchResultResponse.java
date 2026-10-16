package pe.plataformacontenidos.search.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.search.SearchResultType;
import pe.plataformacontenidos.series.Episode;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Forma unificada de un resultado de búsqueda, sea cual sea el tipo de
 * contenido de origen (CONTEXTO.md sección 16 y 20: "cuando existan
 * Lugares/Eventos/Directorio, esto se separa a un módulo Search propio que
 * agregue resultados de varios módulos" — ya hay dos tipos buscables, este
 * es ese momento). El frontend arma la URL a partir de `contentType` +
 * `slug` (/publicaciones/{slug} o /lugares/{slug}). featuredImageId/
 * featuredImageUrl son excluyentes (ver ContentImage) en Article/Place/
 * Event, que ya soportan imágenes por enlace externo además de subidas;
 * Gallery/Business todavía son solo imágenes subidas.
 */
public record SearchResultResponse(
        SearchResultType contentType,
        UUID id,
        String slug,
        String title,
        String excerpt,
        UUID categoryId,
        UUID featuredImageId,
        String featuredImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        /** Solo Evento la trae (rango de fechas del buscador) — null en los demás tipos. */
        Instant eventStartsAt,
        /** Solo Episodio: su URL es /series/{seriesSlug}/{slug} — null en los demás tipos. */
        String seriesSlug) {

    public static SearchResultResponse fromArticle(Article article) {
        ContentImage cover = article.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.ARTICLE,
                article.getId(),
                article.getSlug(),
                article.getTitle(),
                article.getExcerpt(),
                article.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !article.getVideos().isEmpty(),
                article.getPublishedAt(),
                null,
                null);
    }

    public static SearchResultResponse fromPlace(Place place) {
        ContentImage cover = place.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.PLACE,
                place.getId(),
                place.getSlug(),
                place.getName(),
                place.getExcerpt(),
                place.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !place.getVideos().isEmpty(),
                place.getPublishedAt(),
                null,
                null);
    }

    public static SearchResultResponse fromEvent(Event event) {
        ContentImage cover = event.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.EVENT,
                event.getId(),
                event.getSlug(),
                event.getTitle(),
                event.getExcerpt(),
                event.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !event.getVideos().isEmpty(),
                event.getPublishedAt(),
                event.getStartsAt(),
                null);
    }

    public static SearchResultResponse fromGallery(Gallery gallery) {
        ContentImage cover = gallery.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.GALLERY,
                gallery.getId(),
                gallery.getSlug(),
                gallery.getTitle(),
                gallery.getExcerpt(),
                gallery.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                false,
                gallery.getPublishedAt(),
                null,
                null);
    }

    public static SearchResultResponse fromBusiness(Business business) {
        ContentImage cover = business.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.BUSINESS,
                business.getId(),
                business.getSlug(),
                business.getName(),
                business.getExcerpt(),
                business.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !business.getVideos().isEmpty(),
                business.getPublishedAt(),
                null,
                null);
    }

    /** Episodio: portada = miniatura de YouTube (igual que en el feed); tema = el de su serie. */
    public static SearchResultResponse fromEpisode(Episode episode, Series series) {
        return new SearchResultResponse(
                SearchResultType.EPISODE,
                episode.getId(),
                episode.getSlug(),
                episode.getTitle(),
                episode.getDescription(),
                series.getCategoryId(),
                null,
                "https://i.ytimg.com/vi/" + episode.getYoutubeVideoId() + "/hqdefault.jpg",
                true,
                episode.getPublishedAt(),
                null,
                series.getSlug());
    }
}
