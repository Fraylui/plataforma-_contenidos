package pe.plataformacontenidos.advertising.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.advertising.Advertiser;
import pe.plataformacontenidos.advertising.CallToAction;
import pe.plataformacontenidos.advertising.Campaign;
import pe.plataformacontenidos.advertising.CampaignFormat;
import pe.plataformacontenidos.advertising.CampaignService;
import pe.plataformacontenidos.advertising.NativeAd;

/**
 * Forma pública, distinta de {@link CampaignResponse}: nunca expone
 * `linkUrl` crudo — el frontend arma el link de clic con `id`
 * (`/api/v1/ads/campaigns/{id}/click`), así el conteo de clics no se puede
 * evitar copiando el href; del anuncio nativo solo sale el dominio
 * (`displayDomain`), como la barra de un anuncio de Meta. `advertiserId`
 * permite al navegador no mostrar dos anuncios del mismo anunciante en una
 * página (ver page-ad-plan.ts). Los campos del nativo son null en un banner.
 */
public record ActiveCampaignResponse(UUID id, UUID advertiserId, CampaignFormat format, UUID imageId,
        String externalImageUrl, String imageAlt, String advertiserName, UUID advertiserLogoImageId,
        String primaryText, String headline, CallToAction callToAction, String displayDomain, String youtubeVideoId,
        String mediaAspect) {

    public static ActiveCampaignResponse from(Campaign campaign, Advertiser advertiser) {
        var creative = campaign.getCreative();
        NativeAd ad = campaign.getNativeAd();
        boolean isNative = ad != null;
        return new ActiveCampaignResponse(campaign.getId(), campaign.getAdvertiserId(), campaign.getFormat(),
                creative == null ? null : creative.getImageId(), creative == null ? null : creative.getExternalUrl(),
                creative == null ? null : creative.getTitle(),
                isNative && advertiser != null ? advertiser.getName() : null,
                isNative && advertiser != null ? advertiser.getLogoImageId() : null,
                isNative ? ad.primaryText() : null, isNative ? ad.headline() : null,
                isNative ? ad.callToAction() : null,
                isNative ? CampaignService.displayDomain(campaign.getLinkUrl()) : null,
                isNative ? ad.youtubeVideoId() : null, isNative ? ad.mediaAspect() : null);
    }
}
