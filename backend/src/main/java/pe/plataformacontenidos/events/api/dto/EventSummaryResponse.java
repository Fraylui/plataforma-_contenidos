package pe.plataformacontenidos.events.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.events.Event;

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
        boolean hasVideo) {

    public static EventSummaryResponse from(Event event) {
        UUID coverImageId = event.getImageIds().isEmpty() ? null : event.getImageIds().get(0);
        return new EventSummaryResponse(event.getId(), event.getSlug(), event.getTitle(), event.getExcerpt(),
                event.getCategoryId(), event.getGeographyId(), event.getPlaceId(), event.getVenueName(),
                event.getStartsAt(), event.getEndsAt(), coverImageId, event.getYoutubeVideoId() != null);
    }
}
