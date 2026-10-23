package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.advertising.CampaignDraftValidator.ValidatedCreative;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Campañas de publicidad directa en el panel: alta, edición, activar y
 * borrar. Las reglas del borrador las aplica {@link CampaignDraftValidator} y
 * el cupo por público {@link AdInventory}; lo que ve el visitante es
 * {@link AdDeliveryService} y lo que se mide, {@link CampaignTrackingService}.
 */
@Service
@Transactional
public class CampaignService {

    /**
     * Lo que pide el panel para un anuncio nativo, sin validar. El medio es
     * la foto de la creatividad ({@code imageId}) o {@code videoUrl}.
     */
    public record NativeAdInput(String primaryText, String headline, CallToAction callToAction, String videoUrl) {
    }

    /** Datos comunes de alta y edición; {@code format} null = banner (clientes que no lo mandan). */
    public record CampaignDraft(String placementKey, CampaignFormat format, ContentImageInput creative,
            NativeAdInput nativeAd, String linkUrl, Instant startsAt, Instant endsAt, BigDecimal amount,
            String currency, Integer weight, CampaignTargeting targeting, boolean complianceConfirmed) {
    }

    private final CampaignRepository campaignRepository;
    private final AdvertiserRepository advertiserRepository;
    private final CampaignDraftValidator validator;
    private final AdInventory inventory;

    public CampaignService(CampaignRepository campaignRepository, AdvertiserRepository advertiserRepository,
            CampaignDraftValidator validator, AdInventory inventory) {
        this.campaignRepository = campaignRepository;
        this.advertiserRepository = advertiserRepository;
        this.validator = validator;
        this.inventory = inventory;
    }

    public Campaign create(UUID advertiserId, CampaignDraft draft) {
        requireAdvertiserExists(advertiserId);
        ValidatedCreative valid = validator.validate(draft);
        // Una campaña nueva nace activa: ocupa cupo desde ya.
        inventory.requireRoomFor(null, valid.placementKey(), draft.startsAt(), draft.endsAt(), draft.targeting());
        Campaign campaign = new Campaign(advertiserId, valid.placementKey(), valid.creative(), draft.linkUrl().strip(),
                draft.startsAt(), draft.endsAt(), draft.amount(), draft.currency(),
                draft.weight() != null ? draft.weight() : Campaign.DEFAULT_WEIGHT, draft.targeting());
        campaign.setNativeAd(valid.nativeAd());
        campaign.confirmCompliance();
        return campaignRepository.save(campaign);
    }

    public Campaign update(UUID id, CampaignDraft draft) {
        Campaign campaign = getOrThrow(id);
        ValidatedCreative valid = validator.validate(draft);
        if (campaign.isActive()) {
            inventory.requireRoomFor(id, valid.placementKey(), draft.startsAt(), draft.endsAt(), draft.targeting());
        }
        campaign.update(valid.placementKey(), valid.creative(), draft.linkUrl().strip(), draft.startsAt(),
                draft.endsAt(), draft.amount(), draft.currency(),
                draft.weight() != null ? draft.weight() : campaign.getWeight(), draft.targeting());
        campaign.setNativeAd(valid.nativeAd());
        campaign.confirmCompliance();
        return campaignRepository.save(campaign);
    }

    public void setActive(UUID id, boolean active) {
        Campaign campaign = getOrThrow(id);
        if (active && !campaign.isActive()) {
            inventory.requireRoomFor(id, campaign.getPlacementKey(), campaign.getStartsAt(), campaign.getEndsAt(),
                    campaign.getTargeting());
        }
        campaign.setActive(active);
        campaignRepository.save(campaign);
    }

    public void delete(UUID id) {
        campaignRepository.deleteById(id);
    }

    public List<Campaign> listAll() {
        return campaignRepository.findAll();
    }

    public List<Campaign> listByAdvertiser(UUID advertiserId) {
        return campaignRepository.findByAdvertiserId(advertiserId);
    }

    public Campaign getOrThrow(UUID id) {
        return campaignRepository.findById(id).orElseThrow(() -> new CampaignNotFoundException(id));
    }

    private void requireAdvertiserExists(UUID advertiserId) {
        if (!advertiserRepository.existsById(advertiserId)) {
            throw new AdvertiserNotFoundException(advertiserId);
        }
    }
}
