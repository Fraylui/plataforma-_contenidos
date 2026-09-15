package pe.plataformacontenidos.places.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceStatus;
import pe.plataformacontenidos.shared.ContentImageResponse;
import pe.plataformacontenidos.shared.ContentVideoResponse;

public record PlaceResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        String body,
        PlaceStatus status,
        UUID authorId,
        UUID categoryId,
        Double latitude,
        Double longitude,
        List<ContentImageResponse> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoResponse> videos,
        String robots,
        String rejectionReason,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        long likeCount) {

    public static PlaceResponse from(Place place, long likeCount) {
        return new PlaceResponse(place.getId(), place.getSlug(), place.getName(), place.getExcerpt(),
                place.getBody(), place.getStatus(), place.getAuthorId(), place.getCategoryId(),
                place.getLatitude(), place.getLongitude(),
                place.getImages().stream().map(ContentImageResponse::from).toList(), place.getSeoTitle(),
                place.getMetaDescription(), place.getCanonicalUrl(), place.getOgImageUrl(),
                place.getVideos().stream().map(ContentVideoResponse::from).toList(), place.getRobots(),
                place.getRejectionReason(), place.getPublishedAt(), place.getScheduledAt(), place.getCreatedAt(),
                likeCount);
    }

    /** Para respuestas admin (creación/edición/transiciones), sin costo de calcular likes. */
    public static PlaceResponse fromAdmin(Place place) {
        return from(place, 0);
    }
}
