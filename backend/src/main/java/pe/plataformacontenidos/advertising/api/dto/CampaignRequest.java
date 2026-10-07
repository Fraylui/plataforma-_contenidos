package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.advertising.AdSection;
import pe.plataformacontenidos.advertising.CampaignTargeting;

public record CampaignRequest(@NotNull UUID advertiserId, @NotBlank String placementKey, UUID imageId,
        String externalImageUrl, String imageAlt, @NotBlank String linkUrl, Instant startsAt, Instant endsAt,
        BigDecimal amount, String currency, @Min(1) @Max(10) Integer weight, List<AdSection> targetSections,
        List<UUID> targetCategoryIds, List<String> targetCountries, List<String> targetRegions) {

    /** Vacío o ausente en cada dimensión = sin restricción (clientes viejos que no la mandan: todo el sitio). */
    public CampaignTargeting targeting() {
        return CampaignTargeting.of(targetSections, targetCategoryIds, targetCountries, targetRegions);
    }
}
