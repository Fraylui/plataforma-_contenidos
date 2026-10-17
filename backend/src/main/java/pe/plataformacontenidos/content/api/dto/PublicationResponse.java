package pe.plataformacontenidos.content.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.content.PublicationType;
import pe.plataformacontenidos.shared.ContentImageResponse;
import pe.plataformacontenidos.shared.ContentVideoResponse;

public record PublicationResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String body,
        PublicationType publicationType,
        PublicationStatus status,
        UUID authorId,
        UUID categoryId,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentImageResponse> images,
        List<ContentVideoResponse> videos,
        String robots,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        Instant updatedAt,
        long likeCount) {

    public static PublicationResponse from(Publication publication, long likeCount) {
        return new PublicationResponse(publication.getId(), publication.getSlug(), publication.getTitle(), publication.getExcerpt(),
                publication.getBody(), publication.getPublicationType(), publication.getStatus(), publication.getAuthorId(),
                publication.getCategoryId(), publication.getSeoTitle(),
                publication.getMetaDescription(), publication.getCanonicalUrl(), publication.getOgImageUrl(),
                publication.getImages().stream().map(ContentImageResponse::from).toList(),
                publication.getVideos().stream().map(ContentVideoResponse::from).toList(), publication.getRobots(),
                publication.getPublishedAt(), publication.getScheduledAt(),
                publication.getCreatedAt(), publication.getUpdatedAt(), likeCount);
    }

    /** Para contextos sin conteo de "me gusta" calculado (admin). */
    public static PublicationResponse from(Publication publication) {
        return from(publication, 0);
    }
}
