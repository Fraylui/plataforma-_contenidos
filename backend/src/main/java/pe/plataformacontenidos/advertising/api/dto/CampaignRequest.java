package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CampaignRequest(@NotNull UUID advertiserId, @NotBlank String placementKey, UUID imageId,
        String externalImageUrl, String imageAlt, @NotBlank String linkUrl, Instant startsAt, Instant endsAt,
        BigDecimal amount, String currency) {
}
