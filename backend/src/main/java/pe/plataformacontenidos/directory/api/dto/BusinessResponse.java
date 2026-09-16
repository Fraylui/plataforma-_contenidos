package pe.plataformacontenidos.directory.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessStatus;
import pe.plataformacontenidos.directory.BusinessType;
import pe.plataformacontenidos.shared.ContentImageResponse;
import pe.plataformacontenidos.shared.ContentVideoResponse;

public record BusinessResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        String body,
        BusinessStatus status,
        BusinessType businessType,
        UUID authorId,
        UUID categoryId,
        UUID placeId,
        String address,
        String phone,
        String email,
        String website,
        Double latitude,
        Double longitude,
        List<ContentImageResponse> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoResponse> videos,
        String robots,
        String rejectionReason,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        long likeCount) {

    public static BusinessResponse from(Business business, long likeCount) {
        return new BusinessResponse(business.getId(), business.getSlug(), business.getName(), business.getExcerpt(),
                business.getBody(), business.getStatus(), business.getBusinessType(), business.getAuthorId(),
                business.getCategoryId(), business.getPlaceId(), business.getAddress(),
                business.getPhone(), business.getEmail(), business.getWebsite(), business.getLatitude(),
                business.getLongitude(), business.getImages().stream().map(ContentImageResponse::from).toList(),
                business.getSeoTitle(), business.getMetaDescription(), business.getCanonicalUrl(),
                business.getOgImageUrl(), business.getVideos().stream().map(ContentVideoResponse::from).toList(),
                business.getRobots(), business.getRejectionReason(), business.getPublishedAt(),
                business.getScheduledAt(), business.getCreatedAt(), likeCount);
    }

    public static BusinessResponse from(Business business) {
        return from(business, 0);
    }
}
