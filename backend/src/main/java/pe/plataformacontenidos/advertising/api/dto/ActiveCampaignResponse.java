package pe.plataformacontenidos.advertising.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.advertising.Campaign;

/**
 * Forma pública, distinta de {@link CampaignResponse}: nunca expone
 * `linkUrl` crudo — el frontend arma el link de clic con `id`
 * (`/api/v1/ads/campaigns/{id}/click`), así el conteo de clics no se puede
 * evitar copiando el href.
 */
public record ActiveCampaignResponse(UUID id, UUID imageId, String externalImageUrl, String imageAlt) {

    public static ActiveCampaignResponse from(Campaign campaign) {
        var creative = campaign.getCreative();
        return new ActiveCampaignResponse(campaign.getId(), creative.getImageId(), creative.getExternalUrl(),
                creative.getTitle());
    }
}
