package pe.plataformacontenidos.places.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.shared.ContentImage;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record PlaceSummaryResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        UUID categoryId,
        Double latitude,
        Double longitude,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        long likeCount) {

    public static PlaceSummaryResponse from(Place place, long likeCount) {
        ContentImage cover = place.getCoverImage();
        return new PlaceSummaryResponse(place.getId(), place.getSlug(), place.getName(), place.getExcerpt(),
                place.getCategoryId(), place.getLatitude(), place.getLongitude(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !place.getVideos().isEmpty(), place.getPublishedAt(), likeCount);
    }
}
