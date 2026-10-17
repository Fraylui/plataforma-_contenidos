package pe.plataformacontenidos.advertising.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.advertising.AdSection;
import pe.plataformacontenidos.advertising.CallToAction;
import pe.plataformacontenidos.advertising.Campaign;
import pe.plataformacontenidos.advertising.CampaignFormat;
import pe.plataformacontenidos.advertising.NativeAd;

/** Campos del anuncio nativo (primaryText…mediaAspect) en null si es un banner; playCount solo crece en nativos con video. */
public record CampaignResponse(UUID id, UUID advertiserId, String placementKey, CampaignFormat format, UUID imageId,
        String externalImageUrl, String imageAlt, String linkUrl, Instant startsAt, Instant endsAt, boolean active,
        long impressionCount, long clickCount, long playCount, BigDecimal amount, String currency, int weight,
        List<AdSection> targetSections, List<UUID> targetCategoryIds, List<String> targetCountries,
        List<String> targetRegions, String primaryText, String headline, CallToAction callToAction,
        String youtubeVideoId, String mediaAspect, Instant complianceConfirmedAt) {

    public static CampaignResponse from(Campaign campaign) {
        var creative = campaign.getCreative();
        var targeting = campaign.getTargeting();
        NativeAd ad = campaign.getNativeAd();
        return new CampaignResponse(campaign.getId(), campaign.getAdvertiserId(), campaign.getPlacementKey(),
                campaign.getFormat(), creative == null ? null : creative.getImageId(),
                creative == null ? null : creative.getExternalUrl(), creative == null ? null : creative.getTitle(),
                campaign.getLinkUrl(), campaign.getStartsAt(), campaign.getEndsAt(), campaign.isActive(),
                campaign.getImpressionCount(), campaign.getClickCount(), campaign.getPlayCount(), campaign.getAmount(),
                campaign.getCurrency(), campaign.getWeight(), targeting.sections().stream().sorted().toList(),
                List.copyOf(targeting.categoryIds()), targeting.countries().stream().sorted().toList(),
                targeting.regions().stream().sorted().toList(), ad == null ? null : ad.primaryText(),
                ad == null ? null : ad.headline(), ad == null ? null : ad.callToAction(),
                ad == null ? null : ad.youtubeVideoId(), ad == null ? null : ad.mediaAspect(),
                campaign.getComplianceConfirmedAt());
    }
}
