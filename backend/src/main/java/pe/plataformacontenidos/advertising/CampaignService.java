package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Orquesta campañas de publicidad directa. La resolución pública
 * (`resolveActive`) es lo que AdBlock consulta antes de caer a AdSense —
 * incrementa el contador de impresión en el mismo golpe: cada vez que el
 * frontend pide "hay campaña para esta posición" y hay una, se cuenta como
 * una vista real (mismo criterio que un ad server simple).
 */
@Service
@Transactional
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final AdvertiserRepository advertiserRepository;
    private final AdPlacementRepository adPlacementRepository;
    private final ImageService imageService;

    public CampaignService(CampaignRepository campaignRepository, AdvertiserRepository advertiserRepository,
            AdPlacementRepository adPlacementRepository, ImageService imageService) {
        this.campaignRepository = campaignRepository;
        this.advertiserRepository = advertiserRepository;
        this.adPlacementRepository = adPlacementRepository;
        this.imageService = imageService;
    }

    public Campaign create(UUID advertiserId, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency) {
        requireAdvertiserExists(advertiserId);
        requirePlacementExists(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        ContentImage creative = validateCreative(creativeInput);
        return campaignRepository.save(
                new Campaign(advertiserId, placementKey, creative, linkUrl, startsAt, endsAt, amount, currency));
    }

    public Campaign update(UUID id, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency) {
        Campaign campaign = getOrThrow(id);
        requirePlacementExists(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        ContentImage creative = validateCreative(creativeInput);
        campaign.update(placementKey, creative, linkUrl, startsAt, endsAt, amount, currency);
        return campaignRepository.save(campaign);
    }

    public void setActive(UUID id, boolean active) {
        Campaign campaign = getOrThrow(id);
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

    /** La primera campaña vigente para la posición (orden de creación) — cuenta como una impresión. */
    /**
     * Si hay más de una campaña activa vendida para la misma posición al
     * mismo tiempo, se rota al azar entre todas las que están vigentes en
     * vez de siempre devolver la más antigua — así cada anunciante que pagó
     * esa posición recibe impresiones repartidas (decisión del usuario:
     * varias campañas por posición es un caso soportado, no un error de
     * venta). Con volumen de tráfico normal, la aleatoriedad por pedido se
     * reparte de forma pareja sin necesitar guardar turno en ningún lado.
     */
    public Optional<Campaign> resolveActive(String placementKey) {
        Instant now = Instant.now();
        List<Campaign> candidates = campaignRepository.findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(placementKey)
                .stream()
                .filter(campaign -> campaign.isCurrentlyServable(now))
                .toList();
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        Campaign chosen = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
        chosen.recordImpression();
        campaignRepository.save(chosen);
        return Optional.of(chosen);
    }

    /** Registra el clic y devuelve a dónde redirigir — el link real nunca queda expuesto directo en el HTML. */
    public String recordClickAndGetLinkUrl(UUID id) {
        Campaign campaign = getOrThrow(id);
        campaign.recordClick();
        campaignRepository.save(campaign);
        return campaign.getLinkUrl();
    }

    private void requireAdvertiserExists(UUID advertiserId) {
        if (!advertiserRepository.existsById(advertiserId)) {
            throw new AdvertiserNotFoundException(advertiserId);
        }
    }

    private void requirePlacementExists(String placementKey) {
        if (!adPlacementRepository.existsByKey(placementKey)) {
            throw new AdPlacementKeyNotFoundException(placementKey);
        }
    }

    private void requireValidSchedule(Instant startsAt, Instant endsAt) {
        if (startsAt != null && endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new InvalidCampaignScheduleException("La fecha de fin debe ser posterior a la de inicio.");
        }
    }

    private void requireValidAmount(BigDecimal amount) {
        if (amount != null && amount.signum() < 0) {
            throw new InvalidCampaignAmountException("El monto no puede ser negativo.");
        }
    }

    private ContentImage validateCreative(ContentImageInput input) {
        if (input == null || !input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
            throw new InvalidCampaignImageException();
        }
        if (input.hasImageId()) {
            imageService.getOrThrow(input.imageId());
            return ContentImage.uploaded(input.imageId(), input.title(), input.caption());
        }
        return ContentImage.external(input.externalUrl(), input.title(), input.caption());
    }
}
