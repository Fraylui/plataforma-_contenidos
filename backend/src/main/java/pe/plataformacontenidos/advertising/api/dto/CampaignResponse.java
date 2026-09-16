package pe.plataformacontenidos.advertising.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.advertising.Campaign;

public record CampaignResponse(UUID id, UUID advertiserId, String placementKey, UUID imageId, String externalImageUrl,
        String imageAlt, String linkUrl, Instant startsAt, Instant endsAt, boolean active, long impressionCount,
        long clickCount) {

    public static CampaignResponse from(Campaign campaign) {
        var creative = campaign.getCreative();
        return new CampaignResponse(campaign.getId(), campaign.getAdvertiserId(), campaign.getPlacementKey(),
                creative.getImageId(), creative.getExternalUrl(), creative.getTitle(), campaign.getLinkUrl(),
                campaign.getStartsAt(), campaign.getEndsAt(), campaign.isActive(), campaign.getImpressionCount(),
                campaign.getClickCount());
    }
}
