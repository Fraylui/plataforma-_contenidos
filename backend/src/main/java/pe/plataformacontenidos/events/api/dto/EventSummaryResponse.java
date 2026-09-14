package pe.plataformacontenidos.events.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.shared.ContentImage;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record EventSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String venueName,
        Instant startsAt,
        Instant endsAt,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        long likeCount) {

    public static EventSummaryResponse from(Event event, long likeCount) {
        ContentImage cover = event.getCoverImage();
        return new EventSummaryResponse(event.getId(), event.getSlug(), event.getTitle(), event.getExcerpt(),
                event.getCategoryId(), event.getGeographyId(), event.getPlaceId(), event.getVenueName(),
                event.getStartsAt(), event.getEndsAt(), cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(), !event.getVideos().isEmpty(), likeCount);
    }
}
