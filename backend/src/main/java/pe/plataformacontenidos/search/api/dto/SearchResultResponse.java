package pe.plataformacontenidos.search.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.celebrations.Celebration;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.search.SearchResultType;
import pe.plataformacontenidos.series.Episode;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Forma unificada de un resultado de búsqueda, sea cual sea el tipo de
 * contenido de origen (CONTEXTO.md sección 16 y 20: "cuando existan
 * Lugares/Eventos, esto se separa a un módulo Search propio que
 * agregue resultados de varios módulos" — ya hay dos tipos buscables, este
 * es ese momento). El frontend arma la URL a partir de `contentType` +
 * `slug` (/publicaciones/{slug} o /lugares/{slug}). featuredImageId/
 * featuredImageUrl son excluyentes (ver ContentImage) en Publication/Place/
 * Celebration, que ya soportan imágenes por enlace externo además de subidas;
 * Gallery todavía es solo imágenes subidas.
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
        Instant celebrationStartsAt,
        /** Solo Episodio: su URL es /series/{seriesSlug}/{slug} — null en los demás tipos. */
        String seriesSlug) {

    public static SearchResultResponse fromPublication(Publication publication) {
        ContentImage cover = publication.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.PUBLICATION,
                publication.getId(),
                publication.getSlug(),
                publication.getTitle(),
                publication.getExcerpt(),
                publication.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !publication.getVideos().isEmpty(),
                publication.getPublishedAt(),
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

    public static SearchResultResponse fromCelebration(Celebration celebration) {
        ContentImage cover = celebration.getCoverImage();
        return new SearchResultResponse(
                SearchResultType.CELEBRATION,
                celebration.getId(),
                celebration.getSlug(),
                celebration.getTitle(),
                celebration.getExcerpt(),
                celebration.getCategoryId(),
                cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(),
                !celebration.getVideos().isEmpty(),
                celebration.getPublishedAt(),
                celebration.getNextOccurrence(),
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
