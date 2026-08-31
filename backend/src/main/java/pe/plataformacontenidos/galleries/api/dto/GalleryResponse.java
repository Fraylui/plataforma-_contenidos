package pe.plataformacontenidos.galleries.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.galleries.GalleryStatus;

public record GalleryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        GalleryStatus status,
        UUID authorId,
        UUID categoryId,
        UUID geographyId,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String robots,
        String rejectionReason,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        long likeCount,
        boolean likedByVisitor) {

    public static GalleryResponse from(Gallery gallery, long likeCount, boolean likedByVisitor) {
        return new GalleryResponse(gallery.getId(), gallery.getSlug(), gallery.getTitle(), gallery.getExcerpt(),
                gallery.getStatus(), gallery.getAuthorId(), gallery.getCategoryId(), gallery.getGeographyId(),
                gallery.getImageIds(), gallery.getSeoTitle(), gallery.getMetaDescription(), gallery.getCanonicalUrl(),
                gallery.getOgImageUrl(), gallery.getRobots(), gallery.getRejectionReason(), gallery.getPublishedAt(),
                gallery.getScheduledAt(), gallery.getCreatedAt(), likeCount, likedByVisitor);
    }

    public static GalleryResponse from(Gallery gallery) {
        return from(gallery, 0, false);
    }
}
