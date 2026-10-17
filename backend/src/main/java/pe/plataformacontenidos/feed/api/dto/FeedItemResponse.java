package pe.plataformacontenidos.feed.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.content.PublicationType;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.celebrations.Celebration;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.series.Episode;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Forma unificada de un ítem de feed, sea cual sea su tipo de origen — mismo
 * criterio que search.api.dto.SearchResultResponse (CONTEXTO.md sección 16):
 * el frontend arma la URL a partir de `type` + `slug`. A diferencia de
 * SearchResultResponse, acá sí importa likeCount (las tarjetas del home lo
 * muestran, ver CONTEXTO.md sección 43). `publicationType` solo aplica a
 * PUBLICATION (null en Lugar/Evento) — permite mostrar la etiqueta real
 * (Guía/Crónica/…) en vez de un genérico "Publicación", igual que
 * PublicationSummaryResponse. coverImageId/coverImageUrl son excluyentes (ver
 * ContentImage): la primera imagen del contenido, subida o por enlace
 * externo.
 *
 * <p>Tarjeta tipo post (diseño 2026-10-06): `images` alimenta el carrusel
 * (hasta {@link #MAX_IMAGES}); `startsAt` (celebración: la próxima vez que toca), `latitude`/`longitude`
 * (lugar) alimentan la acción de cada tipo (Recordarme, Cómo llegar).
 * Nulos cuando no aplican. `seriesSlug`/`seriesTitle`/`youtubeVideoId` solo en EPISODE: la
 * URL es /series/{seriesSlug}/{slug} y la portada, la miniatura de YouTube.
 */
public record FeedItemResponse(
        ContentType type,
        UUID id,
        String slug,
        String title,
        String excerpt,
        PublicationType publicationType,
        UUID categoryId,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        long likeCount,
        List<FeedImage> images,
        Instant startsAt,
        Double latitude,
        Double longitude,
        String seriesSlug,
        String seriesTitle,
        String youtubeVideoId,
        /** Solo celebraciones: todo el día (sin hora) y si se repite cada año; null en los demás tipos. */
        Boolean allDay,
        Boolean recursYearly) {

    public static final int MAX_IMAGES = 10;

    /** Una imagen del carrusel: subida (`imageId`) o por enlace externo (`externalUrl`), nunca ambas. */
    public record FeedImage(UUID imageId, String externalUrl) {
    }

    public static FeedItemResponse fromPublication(Publication publication, long likeCount) {
        ContentImage cover = publication.getCoverImage();
        return new FeedItemResponse(ContentType.PUBLICATION, publication.getId(), publication.getSlug(), publication.getTitle(),
                publication.getExcerpt(), publication.getPublicationType(), publication.getCategoryId(), imageId(cover),
                externalUrl(cover), !publication.getVideos().isEmpty(), publication.getPublishedAt(), likeCount,
                images(publication.getImages()), null, null, null, null, null, null, null, null);
    }

    public static FeedItemResponse fromPlace(Place place, long likeCount) {
        ContentImage cover = place.getCoverImage();
        return new FeedItemResponse(ContentType.PLACE, place.getId(), place.getSlug(), place.getName(),
                place.getExcerpt(), null, place.getCategoryId(), imageId(cover), externalUrl(cover),
                !place.getVideos().isEmpty(), place.getPublishedAt(), likeCount, images(place.getImages()), null,
                place.getLatitude(), place.getLongitude(), null, null, null, null, null);
    }

    public static FeedItemResponse fromCelebration(Celebration celebration, long likeCount) {
        ContentImage cover = celebration.getCoverImage();
        return new FeedItemResponse(ContentType.CELEBRATION, celebration.getId(), celebration.getSlug(), celebration.getTitle(),
                celebration.getExcerpt(), null, celebration.getCategoryId(), imageId(cover), externalUrl(cover),
                !celebration.getVideos().isEmpty(), celebration.getPublishedAt(), likeCount, images(celebration.getImages()),
                celebration.getNextOccurrence(), null, null, null, null, null, celebration.isAllDay(),
                celebration.isRecursYearly());
    }

    public static FeedItemResponse fromGallery(Gallery gallery, long likeCount) {
        ContentImage cover = gallery.getCoverImage();
        return new FeedItemResponse(ContentType.GALLERY, gallery.getId(), gallery.getSlug(), gallery.getTitle(),
                gallery.getExcerpt(), null, gallery.getCategoryId(), imageId(cover), externalUrl(cover), false,
                gallery.getPublishedAt(), likeCount, images(gallery.getImages()), null, null, null, null, null, null, null, null);
    }


    /** Episodio: portada = miniatura de YouTube (la sirve YouTube); tema = el de su serie. */
    public static FeedItemResponse fromEpisode(Episode episode, Series series, long likeCount) {
        String thumbnail = "https://i.ytimg.com/vi/" + episode.getYoutubeVideoId() + "/hqdefault.jpg";
        return new FeedItemResponse(ContentType.EPISODE, episode.getId(), episode.getSlug(), episode.getTitle(),
                episode.getDescription(), null, series.getCategoryId(), null, thumbnail, true, episode.getPublishedAt(),
                likeCount, List.of(new FeedImage(null, thumbnail)), null, null, null, series.getSlug(),
                series.getTitle(), episode.getYoutubeVideoId(), null, null);
    }

    private static UUID imageId(ContentImage image) {
        return image == null ? null : image.getImageId();
    }

    private static String externalUrl(ContentImage image) {
        return image == null ? null : image.getExternalUrl();
    }

    private static List<FeedImage> images(List<ContentImage> images) {
        return images.stream().limit(MAX_IMAGES).map(i -> new FeedImage(i.getImageId(), i.getExternalUrl())).toList();
    }
}
