package pe.plataformacontenidos.advertising.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.advertising.AdSection;
import pe.plataformacontenidos.advertising.Campaign;

public record CampaignResponse(UUID id, UUID advertiserId, String placementKey, UUID imageId, String externalImageUrl,
        String imageAlt, String linkUrl, Instant startsAt, Instant endsAt, boolean active, long impressionCount,
        long clickCount, BigDecimal amount, String currency, int weight, List<AdSection> targetSections,
        List<UUID> targetCategoryIds, List<String> targetCountries, List<String> targetRegions) {

    public static CampaignResponse from(Campaign campaign) {
        var creative = campaign.getCreative();
        var targeting = campaign.getTargeting();
        return new CampaignResponse(campaign.getId(), campaign.getAdvertiserId(), campaign.getPlacementKey(),
                creative.getImageId(), creative.getExternalUrl(), creative.getTitle(), campaign.getLinkUrl(),
                campaign.getStartsAt(), campaign.getEndsAt(), campaign.isActive(), campaign.getImpressionCount(),
                campaign.getClickCount(), campaign.getAmount(), campaign.getCurrency(), campaign.getWeight(),
                targeting.sections().stream().sorted().toList(), List.copyOf(targeting.categoryIds()),
                targeting.countries().stream().sorted().toList(), targeting.regions().stream().sorted().toList());
    }
}
