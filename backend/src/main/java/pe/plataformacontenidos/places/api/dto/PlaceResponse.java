package pe.plataformacontenidos.places.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.api.dto.ArticleSummaryResponse;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceStatus;

public record PlaceResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        String body,
        PlaceStatus status,
        UUID authorId,
        UUID categoryId,
        UUID geographyId,
        Double latitude,
        Double longitude,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeVideoId,
        String robots,
        String rejectionReason,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        List<ArticleSummaryResponse> relatedArticles,
        long likeCount,
        boolean likedByVisitor) {

    public static PlaceResponse from(Place place, List<ArticleSummaryResponse> relatedArticles, long likeCount, boolean likedByVisitor) {
        return new PlaceResponse(place.getId(), place.getSlug(), place.getName(), place.getExcerpt(),
                place.getBody(), place.getStatus(), place.getAuthorId(), place.getCategoryId(),
                place.getGeographyId(), place.getLatitude(), place.getLongitude(), place.getImageIds(),
                place.getSeoTitle(), place.getMetaDescription(), place.getCanonicalUrl(), place.getOgImageUrl(),
                place.getYoutubeVideoId(), place.getRobots(), place.getRejectionReason(), place.getPublishedAt(),
                place.getScheduledAt(), place.getCreatedAt(), relatedArticles, likeCount, likedByVisitor);
    }

    /** Para respuestas admin (creación/edición/transiciones), sin costo de calcular relacionados/likes. */
    public static PlaceResponse fromAdmin(Place place) {
        return from(place, List.of(), 0, false);
    }
}
