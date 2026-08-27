package pe.plataformacontenidos.events.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.events.EventStatus;

public record EventResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String body,
        EventStatus status,
        UUID authorId,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String venueName,
        Instant startsAt,
        Instant endsAt,
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
        Instant createdAt) {

    public static EventResponse from(Event event) {
        return new EventResponse(event.getId(), event.getSlug(), event.getTitle(), event.getExcerpt(),
                event.getBody(), event.getStatus(), event.getAuthorId(), event.getCategoryId(),
                event.getGeographyId(), event.getPlaceId(), event.getVenueName(), event.getStartsAt(),
                event.getEndsAt(), event.getImageIds(), event.getSeoTitle(), event.getMetaDescription(),
                event.getCanonicalUrl(), event.getOgImageUrl(), event.getYoutubeVideoId(), event.getRobots(),
                event.getRejectionReason(), event.getPublishedAt(), event.getScheduledAt(), event.getCreatedAt());
    }
}
