package pe.plataformacontenidos.celebrations.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.celebrations.Celebration;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.ContentImageResponse;
import pe.plataformacontenidos.shared.ContentVideoResponse;

public record CelebrationResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String body,
        PublicationStatus status,
        UUID authorId,
        UUID categoryId,
        UUID placeId,
        String venueName,
        Instant startsAt,
        Instant endsAt,
        boolean recursYearly,
        boolean allDay,
        Integer sinceYear,
        String scopeCountry,
        String scopeRegion,
        Instant nextOccurrenceAt,
        List<ContentImageResponse> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoResponse> videos,
        String robots,

        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        long likeCount) {

    public static CelebrationResponse from(Celebration celebration, long likeCount) {
        return new CelebrationResponse(celebration.getId(), celebration.getSlug(), celebration.getTitle(), celebration.getExcerpt(),
                celebration.getBody(), celebration.getStatus(), celebration.getAuthorId(), celebration.getCategoryId(),
                celebration.getPlaceId(), celebration.getVenueName(), celebration.getStartsAt(),
                celebration.getEndsAt(), celebration.isRecursYearly(), celebration.isAllDay(), celebration.getSinceYear(),
                celebration.getScopeCountry(), celebration.getScopeRegion(), celebration.getNextOccurrence(), celebration.getImages().stream().map(ContentImageResponse::from).toList(),
                celebration.getSeoTitle(), celebration.getMetaDescription(), celebration.getCanonicalUrl(), celebration.getOgImageUrl(),
                celebration.getVideos().stream().map(ContentVideoResponse::from).toList(), celebration.getRobots(),
                celebration.getPublishedAt(), celebration.getScheduledAt(), celebration.getCreatedAt(),
                likeCount);
    }

    public static CelebrationResponse from(Celebration celebration) {
        return from(celebration, 0);
    }
}
