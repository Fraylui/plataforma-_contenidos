package pe.plataformacontenidos.reviews.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.reviews.Review;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record ReviewSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String subjectName,
        int rating,
        UUID coverImageId,
        Instant publishedAt) {

    public static ReviewSummaryResponse from(Review review) {
        UUID coverImageId = review.getImageIds().isEmpty() ? null : review.getImageIds().get(0);
        return new ReviewSummaryResponse(review.getId(), review.getSlug(), review.getTitle(), review.getExcerpt(),
                review.getCategoryId(), review.getGeographyId(), review.getPlaceId(), review.getSubjectName(),
                review.getRating(), coverImageId, review.getPublishedAt());
    }
}
