package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Orquesta campañas de publicidad directa: alta/edición desde el panel y la
 * entrega pública con las reglas de un ad server profesional —
 *
 * <ol>
 * <li><b>Selección</b> ({@link #rotation}): todas las campañas vigentes de
 * la posición, en orden aleatorio ponderado por {@code weight}
 * ({@link WeightedOrder}), sin las que el visitante ya vio hasta el tope
 * diario ({@link AdDeliveryGuard}). El navegador asigna una distinta a cada
 * espacio de la página: la misma campaña nunca se repite en una vista.</li>
 * <li><b>Impresión visible</b> ({@link #recordImpression}): la cuenta el
 * navegador cuando al menos la mitad del anuncio estuvo un segundo en
 * pantalla (estándar MRC/IAB), no al pedirlo — antes se contaba aunque el
 * visitante nunca bajara hasta el anuncio.</li>
 * <li><b>Clic válido</b> ({@link #recordClickAndGetLinkUrl}): sin robots ni
 * repeticiones; el visitante siempre llega al destino.</li>
 * </ol>
 */
@Service
@Transactional
public class CampaignService {

    /** Tolerancia de proporción al validar la creatividad contra la medida de la posición (redondeos de exportación). */
    private static final double ASPECT_TOLERANCE = 0.02;

    private final CampaignRepository campaignRepository;
    private final CampaignDailyStatRepository dailyStatRepository;
    private final AdvertiserRepository advertiserRepository;
    private final AdPlacementRepository adPlacementRepository;
    private final ImageService imageService;
    private final AdDeliveryGuard deliveryGuard;

    public CampaignService(CampaignRepository campaignRepository, CampaignDailyStatRepository dailyStatRepository,
            AdvertiserRepository advertiserRepository, AdPlacementRepository adPlacementRepository,
            ImageService imageService, AdDeliveryGuard deliveryGuard) {
        this.campaignRepository = campaignRepository;
        this.dailyStatRepository = dailyStatRepository;
        this.advertiserRepository = advertiserRepository;
        this.adPlacementRepository = adPlacementRepository;
        this.imageService = imageService;
        this.deliveryGuard = deliveryGuard;
    }

    /** Lo que se le entrega al navegador para una posición: su medida y las campañas en el orden a usar. */
    public record PlacementRotation(int width, int height, List<Campaign> campaigns) {
    }

    public Campaign create(UUID advertiserId, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency, Integer weight) {
        requireAdvertiserExists(advertiserId);
        AdPlacement placement = requirePlacement(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        ContentImage creative = validateCreative(creativeInput, placement);
        return campaignRepository.save(new Campaign(advertiserId, placementKey, creative, linkUrl, startsAt, endsAt,
                amount, currency, weight != null ? weight : Campaign.DEFAULT_WEIGHT));
    }

    public Campaign update(UUID id, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency, Integer weight) {
        Campaign campaign = getOrThrow(id);
        AdPlacement placement = requirePlacement(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        ContentImage creative = validateCreative(creativeInput, placement);
        campaign.update(placementKey, creative, linkUrl, startsAt, endsAt, amount, currency,
                weight != null ? weight : campaign.getWeight());
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

    /**
     * Campañas para una posición, sin contar nada (contar es trabajo de la
     * impresión visible). Vacío si la posición no existe, está desactivada o
     * no tiene campañas que este visitante pueda ver hoy.
     */
    @Transactional(readOnly = true)
    public Optional<PlacementRotation> rotation(String placementKey, String clientIp) {
        Optional<AdPlacement> placement = adPlacementRepository.findByKey(placementKey).filter(AdPlacement::isEnabled);
        if (placement.isEmpty()) {
            return Optional.empty();
        }
        Instant now = Instant.now();
        List<Campaign> servable = campaignRepository.findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(placementKey)
                .stream()
                .filter(campaign -> campaign.isCurrentlyServable(now))
                .toList();
        List<Boolean> capped = deliveryGuard.frequencyCapped(AdDeliveryGuard.visitorKey(clientIp),
                servable.stream().map(Campaign::getId).toList());
        List<Campaign> eligible = IntStream.range(0, servable.size())
                .filter(i -> !capped.get(i))
                .mapToObj(servable::get)
                .toList();
        if (eligible.isEmpty()) {
            return Optional.empty();
        }
        List<Campaign> ordered = WeightedOrder.order(eligible, Campaign::getWeight, ThreadLocalRandom.current());
        return Optional.of(new PlacementRotation(placement.get().getWidth(), placement.get().getHeight(), ordered));
    }

    /** Impresión visible informada por el navegador. Robots, duplicados y campañas no vigentes no cuentan. */
    public void recordImpression(UUID id, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        Optional<Campaign> campaign = campaignRepository.findById(id);
        if (campaign.isEmpty() || !campaign.get().isCurrentlyServable(Instant.now())) {
            return;
        }
        if (deliveryGuard.acceptImpression(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementImpressions(id);
            dailyStatRepository.add(id, today(), 1, 0);
        }
    }

    /** Devuelve a dónde redirigir — siempre; el clic solo se cuenta si es válido. El link real nunca va en el HTML. */
    public String recordClickAndGetLinkUrl(UUID id, String clientIp, String userAgent) {
        Campaign campaign = getOrThrow(id);
        if (!InvalidTraffic.isAutomated(userAgent)
                && deliveryGuard.acceptClick(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementClicks(id);
            dailyStatRepository.add(id, today(), 0, 1);
        }
        return campaign.getLinkUrl();
    }

    @Transactional(readOnly = true)
    public List<CampaignDailyStat> dailyStats(UUID id, int days) {
        getOrThrow(id);
        return dailyStatRepository.findByCampaignIdAndDayGreaterThanEqualOrderByDayAsc(id, today().minusDays(days - 1L));
    }

    private static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    private void requireAdvertiserExists(UUID advertiserId) {
        if (!advertiserRepository.existsById(advertiserId)) {
            throw new AdvertiserNotFoundException(advertiserId);
        }
    }

    private AdPlacement requirePlacement(String placementKey) {
        return adPlacementRepository.findByKey(placementKey)
                .orElseThrow(() -> new AdPlacementKeyNotFoundException(placementKey));
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

    private ContentImage validateCreative(ContentImageInput input, AdPlacement placement) {
        if (input == null || !input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
            throw new InvalidCampaignImageException();
        }
        if (input.hasImageId()) {
            requireCreativeFits(imageService.getOrThrow(input.imageId()), placement);
            return ContentImage.uploaded(input.imageId(), input.title(), input.caption());
        }
        // Un enlace externo no se puede medir acá sin descargarlo: lo valida el panel al previsualizarlo.
        return ContentImage.external(input.externalUrl(), input.title(), input.caption());
    }

    /**
     * La creatividad tiene que tener la proporción de la posición (se muestra
     * entera, nunca recortada) y al menos su ancho (más chica se vería
     * borrosa). Lo recomendado es el doble, para pantallas de alta densidad.
     */
    private void requireCreativeFits(Image image, AdPlacement placement) {
        double expected = (double) placement.getWidth() / placement.getHeight();
        double actual = (double) image.getWidth() / image.getHeight();
        if (Math.abs(actual - expected) / expected > ASPECT_TOLERANCE || image.getWidth() < placement.getWidth()) {
            throw new InvalidCampaignImageException(String.format(
                    "La imagen mide %d×%d px y esta posición necesita %d×%d (o el doble, %d×%d, recomendado).",
                    image.getWidth(), image.getHeight(), placement.getWidth(), placement.getHeight(),
                    placement.getWidth() * 2, placement.getHeight() * 2));
        }
    }
}
