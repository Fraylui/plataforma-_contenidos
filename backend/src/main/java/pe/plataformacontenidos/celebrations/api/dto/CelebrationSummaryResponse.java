package pe.plataformacontenidos.celebrations.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.celebrations.Celebration;
import pe.plataformacontenidos.shared.ContentImage;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record CelebrationSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
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
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        long likeCount) {

    public static CelebrationSummaryResponse from(Celebration celebration, long likeCount) {
        ContentImage cover = celebration.getCoverImage();
        return new CelebrationSummaryResponse(celebration.getId(), celebration.getSlug(), celebration.getTitle(), celebration.getExcerpt(),
                celebration.getCategoryId(), celebration.getPlaceId(), celebration.getVenueName(),
                celebration.getStartsAt(), celebration.getEndsAt(), celebration.isRecursYearly(), celebration.isAllDay(),
                celebration.getSinceYear(), celebration.getScopeCountry(), celebration.getScopeRegion(), celebration.getNextOccurrence(), cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(), !celebration.getVideos().isEmpty(), likeCount);
    }
}
