package pe.plataformacontenidos.feed.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleType;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.galleries.Gallery;
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
 *
 * <p>Tarjeta tipo post (diseño 2026-10-06): `images` alimenta el carrusel
 * (hasta {@link #MAX_IMAGES}); `startsAt` (evento), `latitude`/`longitude`
 * (lugar, directorio) y `phone`/`website` (directorio) alimentan la acción
 * de cada tipo (Agendar, Cómo llegar, Llamar, Sitio web). Nulos cuando no
 * aplican.
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
        long likeCount,
        List<FeedImage> images,
        Instant startsAt,
        Double latitude,
        Double longitude,
        String phone,
        String website) {

    public static final int MAX_IMAGES = 10;

    /** Una imagen del carrusel: subida (`imageId`) o por enlace externo (`externalUrl`), nunca ambas. */
    public record FeedImage(UUID imageId, String externalUrl) {
    }

    public static FeedItemResponse fromArticle(Article article, long likeCount) {
        ContentImage cover = article.getCoverImage();
        return new FeedItemResponse(ContentType.ARTICLE, article.getId(), article.getSlug(), article.getTitle(),
                article.getExcerpt(), article.getArticleType(), article.getCategoryId(), imageId(cover),
                externalUrl(cover), !article.getVideos().isEmpty(), article.getPublishedAt(), likeCount,
                images(article.getImages()), null, null, null, null, null);
    }

    public static FeedItemResponse fromPlace(Place place, long likeCount) {
        ContentImage cover = place.getCoverImage();
        return new FeedItemResponse(ContentType.PLACE, place.getId(), place.getSlug(), place.getName(),
                place.getExcerpt(), null, place.getCategoryId(), imageId(cover), externalUrl(cover),
                !place.getVideos().isEmpty(), place.getPublishedAt(), likeCount, images(place.getImages()), null,
                place.getLatitude(), place.getLongitude(), null, null);
    }

    public static FeedItemResponse fromEvent(Event event, long likeCount) {
        ContentImage cover = event.getCoverImage();
        return new FeedItemResponse(ContentType.EVENT, event.getId(), event.getSlug(), event.getTitle(),
                event.getExcerpt(), null, event.getCategoryId(), imageId(cover), externalUrl(cover),
                !event.getVideos().isEmpty(), event.getPublishedAt(), likeCount, images(event.getImages()),
                event.getStartsAt(), null, null, null, null);
    }

    public static FeedItemResponse fromGallery(Gallery gallery, long likeCount) {
        ContentImage cover = gallery.getCoverImage();
        return new FeedItemResponse(ContentType.GALLERY, gallery.getId(), gallery.getSlug(), gallery.getTitle(),
                gallery.getExcerpt(), null, gallery.getCategoryId(), imageId(cover), externalUrl(cover), false,
                gallery.getPublishedAt(), likeCount, images(gallery.getImages()), null, null, null, null, null);
    }

    public static FeedItemResponse fromBusiness(Business business, long likeCount) {
        ContentImage cover = business.getCoverImage();
        return new FeedItemResponse(ContentType.BUSINESS, business.getId(), business.getSlug(), business.getName(),
                business.getExcerpt(), null, business.getCategoryId(), imageId(cover), externalUrl(cover),
                !business.getVideos().isEmpty(), business.getPublishedAt(), likeCount, images(business.getImages()),
                null, business.getLatitude(), business.getLongitude(), business.getPhone(), business.getWebsite());
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
