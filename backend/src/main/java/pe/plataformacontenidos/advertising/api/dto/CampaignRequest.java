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
import pe.plataformacontenidos.advertising.CallToAction;
import pe.plataformacontenidos.advertising.CampaignFormat;
import pe.plataformacontenidos.advertising.CampaignService.CampaignDraft;
import pe.plataformacontenidos.advertising.CampaignService.NativeAdInput;
import pe.plataformacontenidos.advertising.CampaignTargeting;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Banner o anuncio nativo (`format`; ausente = banner). En el nativo
 * `placementKey` puede faltar (siempre va en el feed) y el medio es
 * `imageId` o `videoUrl`. `complianceConfirmed` tiene que ser true en cada
 * guardado (D.L. 1044, art. 17.3.f: el anuncio muestra las condiciones).
 */
public record CampaignRequest(@NotNull UUID advertiserId, String placementKey, CampaignFormat format, UUID imageId,
        String externalImageUrl, String imageAlt, @NotBlank String linkUrl, Instant startsAt, Instant endsAt,
        BigDecimal amount, String currency, @Min(1) @Max(10) Integer weight, List<AdSection> targetSections,
        List<UUID> targetCategoryIds, List<String> targetCountries, List<String> targetRegions,
        String primaryText, String headline, CallToAction callToAction, String videoUrl, Boolean complianceConfirmed) {

    public CampaignDraft toDraft() {
        NativeAdInput nativeAd = format == CampaignFormat.NATIVE
                ? new NativeAdInput(primaryText, headline, callToAction, videoUrl)
                : null;
        return new CampaignDraft(placementKey, format, new ContentImageInput(imageId, externalImageUrl, imageAlt, null),
                nativeAd, linkUrl, startsAt, endsAt, amount, currency, weight, targeting(),
                Boolean.TRUE.equals(complianceConfirmed));
    }

    /** Vacío o ausente en cada dimensión = sin restricción (clientes viejos que no la mandan: todo el sitio). */
    public CampaignTargeting targeting() {
        return CampaignTargeting.of(targetSections, targetCategoryIds, targetCountries, targetRegions);
    }
}
