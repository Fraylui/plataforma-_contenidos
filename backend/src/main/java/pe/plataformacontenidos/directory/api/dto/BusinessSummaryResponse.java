package pe.plataformacontenidos.directory.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessType;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record BusinessSummaryResponse(
        UUID id,
        String slug,
        String name,
        String excerpt,
        BusinessType businessType,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String address,
        UUID coverImageId,
        Instant publishedAt) {

    public static BusinessSummaryResponse from(Business business) {
        UUID coverImageId = business.getImageIds().isEmpty() ? null : business.getImageIds().get(0);
        return new BusinessSummaryResponse(business.getId(), business.getSlug(), business.getName(),
                business.getExcerpt(), business.getBusinessType(), business.getCategoryId(),
                business.getGeographyId(), business.getPlaceId(), business.getAddress(), coverImageId,
                business.getPublishedAt());
    }
}
