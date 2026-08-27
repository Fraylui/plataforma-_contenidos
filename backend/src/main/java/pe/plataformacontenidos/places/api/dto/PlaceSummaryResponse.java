package pe.plataformacontenidos.places.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.places.Place;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record PlaceSummaryResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        Double latitude,
        Double longitude,
        UUID coverImageId,
        boolean hasVideo,
        Instant publishedAt) {

    public static PlaceSummaryResponse from(Place place) {
        UUID coverImageId = place.getImageIds().isEmpty() ? null : place.getImageIds().get(0);
        return new PlaceSummaryResponse(place.getId(), place.getSlug(), place.getName(), place.getExcerpt(),
                place.getCategoryId(), place.getGeographyId(), place.getLatitude(), place.getLongitude(),
                coverImageId, place.getYoutubeVideoId() != null, place.getPublishedAt());
    }
}
