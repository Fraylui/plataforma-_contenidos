package pe.plataformacontenidos.feed.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.content.PublicationType;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
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
 * (lugar, directorio) y `phone`/`website` (directorio) alimentan la acción
 * de cada tipo (Agendar, Cómo llegar, Llamar, Sitio web). Nulos cuando no
 * aplican. `seriesSlug`/`seriesTitle`/`youtubeVideoId` solo en EPISODE: la
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
        String phone,
        String website,
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
                images(publication.getImages()), null, null, null, null, null, null, null, null, null, null);
    }

    public static FeedItemResponse fromPlace(Place place, long likeCount) {
        ContentImage cover = place.getCoverImage();
        return new FeedItemResponse(ContentType.PLACE, place.getId(), place.getSlug(), place.getName(),
                place.getExcerpt(), null, place.getCategoryId(), imageId(cover), externalUrl(cover),
                !place.getVideos().isEmpty(), place.getPublishedAt(), likeCount, images(place.getImages()), null,
                place.getLatitude(), place.getLongitude(), null, null, null, null, null, null, null);
    }

    public static FeedItemResponse fromEvent(Event event, long likeCount) {
        ContentImage cover = event.getCoverImage();
        return new FeedItemResponse(ContentType.EVENT, event.getId(), event.getSlug(), event.getTitle(),
                event.getExcerpt(), null, event.getCategoryId(), imageId(cover), externalUrl(cover),
                !event.getVideos().isEmpty(), event.getPublishedAt(), likeCount, images(event.getImages()),
                event.getNextOccurrence(), null, null, null, null, null, null, null, event.isAllDay(),
                event.isRecursYearly());
    }

    public static FeedItemResponse fromGallery(Gallery gallery, long likeCount) {
        ContentImage cover = gallery.getCoverImage();
        return new FeedItemResponse(ContentType.GALLERY, gallery.getId(), gallery.getSlug(), gallery.getTitle(),
                gallery.getExcerpt(), null, gallery.getCategoryId(), imageId(cover), externalUrl(cover), false,
                gallery.getPublishedAt(), likeCount, images(gallery.getImages()), null, null, null, null, null, null, null, null, null, null);
    }

    public static FeedItemResponse fromBusiness(Business business, long likeCount) {
        ContentImage cover = business.getCoverImage();
        return new FeedItemResponse(ContentType.BUSINESS, business.getId(), business.getSlug(), business.getName(),
                business.getExcerpt(), null, business.getCategoryId(), imageId(cover), externalUrl(cover),
                !business.getVideos().isEmpty(), business.getPublishedAt(), likeCount, images(business.getImages()),
                null, business.getLatitude(), business.getLongitude(), business.getPhone(), business.getWebsite(), null, null, null, null, null);
    }

    /** Episodio: portada = miniatura de YouTube (la sirve YouTube); tema = el de su serie. */
    public static FeedItemResponse fromEpisode(Episode episode, Series series, long likeCount) {
        String thumbnail = "https://i.ytimg.com/vi/" + episode.getYoutubeVideoId() + "/hqdefault.jpg";
        return new FeedItemResponse(ContentType.EPISODE, episode.getId(), episode.getSlug(), episode.getTitle(),
                episode.getDescription(), null, series.getCategoryId(), null, thumbnail, true, episode.getPublishedAt(),
                likeCount, List.of(new FeedImage(null, thumbnail)), null, null, null, null, null, series.getSlug(),
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
