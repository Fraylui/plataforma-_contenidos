package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta campañas de publicidad directa: alta/edición desde el panel y la
 * entrega pública con las reglas de un ad server profesional —
 *
 * <ol>
 * <li><b>Segmentación</b> ({@link CampaignTargeting}): sección, tema y
 * ubicación del visitante. En una página, las campañas más específicas que
 * calzan van antes que las generales.</li>
 * <li><b>Cupo</b>: como mucho {@link #MAX_COMPETING_CAMPAIGNS} campañas
 * activas compitiendo por el mismo público — con más, cada anunciante
 * recibiría tan pocas vistas que no le convendría pagar.</li>
 * <li><b>Selección</b> ({@link #rotation}): las campañas vigentes que calzan
 * con el contexto, por nivel de especificidad y dentro de cada nivel en
 * orden aleatorio ponderado por {@code weight}
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

    /** Campañas activas que pueden competir por el mismo público (posición + segmentación + fechas). */
    public static final int MAX_COMPETING_CAMPAIGNS = 5;

    private final CampaignRepository campaignRepository;
    private final CampaignDailyStatRepository dailyStatRepository;
    private final AdvertiserRepository advertiserRepository;
    private final AdPlacementRepository adPlacementRepository;
    private final ImageService imageService;
    private final AdDeliveryGuard deliveryGuard;
    private final CategoryService categoryService;

    public CampaignService(CampaignRepository campaignRepository, CampaignDailyStatRepository dailyStatRepository,
            AdvertiserRepository advertiserRepository, AdPlacementRepository adPlacementRepository,
            ImageService imageService, AdDeliveryGuard deliveryGuard, CategoryService categoryService) {
        this.campaignRepository = campaignRepository;
        this.dailyStatRepository = dailyStatRepository;
        this.advertiserRepository = advertiserRepository;
        this.adPlacementRepository = adPlacementRepository;
        this.imageService = imageService;
        this.deliveryGuard = deliveryGuard;
        this.categoryService = categoryService;
    }

    /** Lo que se le entrega al navegador para una posición: su medida y las campañas en el orden a usar. */
    public record PlacementRotation(int width, int height, List<Campaign> campaigns) {
    }

    public Campaign create(UUID advertiserId, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency, Integer weight,
            CampaignTargeting targeting) {
        requireAdvertiserExists(advertiserId);
        AdPlacement placement = requirePlacement(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        requireExistingCategories(targeting);
        ContentImage creative = validateCreative(creativeInput, placement);
        // Una campaña nueva nace activa: ocupa cupo desde ya.
        requireInventory(null, placementKey, startsAt, endsAt, targeting);
        return campaignRepository.save(new Campaign(advertiserId, placementKey, creative, linkUrl, startsAt, endsAt,
                amount, currency, weight != null ? weight : Campaign.DEFAULT_WEIGHT, targeting));
    }

    public Campaign update(UUID id, String placementKey, ContentImageInput creativeInput, String linkUrl,
            Instant startsAt, Instant endsAt, BigDecimal amount, String currency, Integer weight,
            CampaignTargeting targeting) {
        Campaign campaign = getOrThrow(id);
        AdPlacement placement = requirePlacement(placementKey);
        requireValidSchedule(startsAt, endsAt);
        requireValidAmount(amount);
        requireExistingCategories(targeting);
        ContentImage creative = validateCreative(creativeInput, placement);
        if (campaign.isActive()) {
            requireInventory(id, placementKey, startsAt, endsAt, targeting);
        }
        campaign.update(placementKey, creative, linkUrl, startsAt, endsAt, amount, currency,
                weight != null ? weight : campaign.getWeight(), targeting);
        return campaignRepository.save(campaign);
    }

    public void setActive(UUID id, boolean active) {
        Campaign campaign = getOrThrow(id);
        if (active && !campaign.isActive()) {
            requireInventory(id, campaign.getPlacementKey(), campaign.getStartsAt(), campaign.getEndsAt(),
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

    /**
     * Campañas para una posición, sin contar nada (contar es trabajo de la
     * impresión visible). Vacío si la posición no existe, está desactivada o
     * no tiene campañas que este visitante pueda ver hoy.
     */
    @Transactional(readOnly = true)
    public Optional<PlacementRotation> rotation(String placementKey, String clientIp, AdSection section,
            UUID categoryId, String country, String region, String regionCode) {
        AdContext context = new AdContext(section, categoryId != null ? categoryService.lineage(categoryId) : Set.of(),
                country, region, regionCode);
        Optional<AdPlacement> placement = adPlacementRepository.findByKey(placementKey).filter(AdPlacement::isEnabled);
        if (placement.isEmpty()) {
            return Optional.empty();
        }
        Instant now = Instant.now();
        List<Campaign> servable = campaignRepository.findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(placementKey)
                .stream()
                .filter(campaign -> campaign.isCurrentlyServable(now))
                .filter(campaign -> campaign.getTargeting().matches(context))
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
        // Más específica primero (calza con más dimensiones del contexto); dentro de cada nivel, ponderada.
        Map<Integer, List<Campaign>> bySpecificity = eligible.stream()
                .collect(Collectors.groupingBy(campaign -> campaign.getTargeting().specificity()));
        List<Campaign> ordered = bySpecificity.keySet().stream()
                .sorted(Comparator.reverseOrder())
                .flatMap(level -> WeightedOrder.order(bySpecificity.get(level), Campaign::getWeight,
                        ThreadLocalRandom.current()).stream())
                .toList();
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

    private void requireExistingCategories(CampaignTargeting targeting) {
        for (UUID categoryId : targeting.categoryIds()) {
            try {
                categoryService.getOrThrow(categoryId);
            } catch (CategoryNotFoundException e) {
                throw new InvalidCampaignTargetingException("Uno de los temas elegidos ya no existe.");
            }
        }
    }

    /**
     * Cupo por público: cuenta las campañas activas, no vencidas, de la misma
     * posición cuyas fechas y segmentación se cruzan con las de esta. Con
     * {@link #MAX_COMPETING_CAMPAIGNS} o más, una nueva le quitaría vistas a
     * las que ya pagaron.
     */
    private void requireInventory(UUID selfId, String placementKey, Instant startsAt, Instant endsAt,
            CampaignTargeting targeting) {
        Instant now = Instant.now();
        Map<UUID, Set<UUID>> lineageCache = new HashMap<>();
        Function<UUID, Set<UUID>> lineage = id -> lineageCache.computeIfAbsent(id, categoryService::lineage);
        long competing = campaignRepository.findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(placementKey).stream()
                .filter(other -> !other.getId().equals(selfId))
                .filter(other -> other.getEndsAt() == null || other.getEndsAt().isAfter(now))
                .filter(other -> schedulesOverlap(other.getStartsAt(), other.getEndsAt(), startsAt, endsAt))
                .filter(other -> other.getTargeting().overlaps(targeting, lineage))
                .count();
        if (competing >= MAX_COMPETING_CAMPAIGNS) {
            throw new AdInventoryFullException(String.format(
                    "Ya hay %d campañas activas para este espacio y este público en esas fechas (máximo %d). "
                            + "Elige otro tema, sección o zona, otras fechas, o desactiva una de las actuales.",
                    competing, MAX_COMPETING_CAMPAIGNS));
        }
    }

    /** Rangos abiertos (null = sin inicio / sin fin). */
    private static boolean schedulesOverlap(Instant aStart, Instant aEnd, Instant bStart, Instant bEnd) {
        boolean aBeforeB = aEnd != null && bStart != null && !aEnd.isAfter(bStart);
        boolean bBeforeA = bEnd != null && aStart != null && !bEnd.isAfter(aStart);
        return !aBeforeB && !bBeforeA;
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
