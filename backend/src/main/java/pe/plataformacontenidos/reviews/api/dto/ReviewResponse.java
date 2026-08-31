package pe.plataformacontenidos.reviews.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.reviews.Review;
import pe.plataformacontenidos.reviews.ReviewStatus;

public record ReviewResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String body,
        ReviewStatus status,
        UUID authorId,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String subjectName,
        int rating,
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
        long likeCount) {

    public static ReviewResponse from(Review review, long likeCount) {
        return new ReviewResponse(review.getId(), review.getSlug(), review.getTitle(), review.getExcerpt(),
                review.getBody(), review.getStatus(), review.getAuthorId(), review.getCategoryId(),
                review.getGeographyId(), review.getPlaceId(), review.getSubjectName(), review.getRating(),
                review.getImageIds(), review.getSeoTitle(), review.getMetaDescription(), review.getCanonicalUrl(),
                review.getOgImageUrl(), review.getYoutubeVideoId(), review.getRobots(),
                review.getRejectionReason(), review.getPublishedAt(), review.getScheduledAt(),
                review.getCreatedAt(), likeCount);
    }

    public static ReviewResponse from(Review review) {
        return from(review, 0);
    }
}
