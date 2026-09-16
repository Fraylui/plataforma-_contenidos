package pe.plataformacontenidos.directory.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessType;
import pe.plataformacontenidos.shared.ContentImage;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record BusinessSummaryResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        BusinessType businessType,
        UUID categoryId,
        UUID placeId,
        String address,
        UUID coverImageId,
        String coverImageUrl,
        Instant publishedAt,
        long likeCount) {

    public static BusinessSummaryResponse from(Business business, long likeCount) {
        ContentImage cover = business.getCoverImage();
        return new BusinessSummaryResponse(business.getId(), business.getSlug(), business.getName(),
                business.getExcerpt(), business.getBusinessType(), business.getCategoryId(),
                business.getPlaceId(), business.getAddress(), cover == null ? null : cover.getImageId(),
                cover == null ? null : cover.getExternalUrl(), business.getPublishedAt(), likeCount);
    }
}
