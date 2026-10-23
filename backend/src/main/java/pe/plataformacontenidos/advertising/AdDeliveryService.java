package pe.plataformacontenidos.advertising;

import java.time.Instant;
import java.util.Comparator;
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
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Qué campañas ve un visitante en una posición, con las reglas de un ad
 * server profesional: <b>segmentación</b> ({@link CampaignTargeting}: sección,
 * tema y ubicación; las más específicas que calzan van antes), <b>selección</b>
 * aleatoria ponderada por {@code weight} dentro de cada nivel
 * ({@link WeightedOrder}) y <b>tope diario</b> por visitante
 * ({@link AdDeliveryGuard}). El navegador asigna una distinta a cada espacio
 * de la página: la misma campaña nunca se repite en una vista. No cuenta nada:
 * eso es la impresión visible ({@link CampaignTrackingService}).
 */
@Service
@Transactional(readOnly = true)
public class AdDeliveryService {

    /**
     * Lo que se le entrega al navegador para una posición: su medida, las
     * campañas en el orden a usar y sus anunciantes (nombre y logo del
     * anuncio nativo), cargados en una sola consulta.
     */
    public record PlacementRotation(int width, int height, List<Campaign> campaigns,
            Map<UUID, Advertiser> advertisers) {
    }

    private final AdPlacementRepository adPlacementRepository;
    private final CampaignRepository campaignRepository;
    private final AdvertiserRepository advertiserRepository;
    private final AdDeliveryGuard deliveryGuard;
    private final CategoryService categoryService;

    public AdDeliveryService(AdPlacementRepository adPlacementRepository, CampaignRepository campaignRepository,
            AdvertiserRepository advertiserRepository, AdDeliveryGuard deliveryGuard, CategoryService categoryService) {
        this.adPlacementRepository = adPlacementRepository;
        this.campaignRepository = campaignRepository;
        this.advertiserRepository = advertiserRepository;
        this.deliveryGuard = deliveryGuard;
        this.categoryService = categoryService;
    }

    /**
     * Campañas para una posición, sin contar nada (contar es trabajo de la
     * impresión visible). Vacío si la posición no existe, está desactivada o
     * no tiene campañas que este visitante pueda ver hoy.
     */
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
        Map<UUID, Advertiser> advertisers = advertiserRepository
                .findAllById(ordered.stream().map(Campaign::getAdvertiserId).distinct().toList()).stream()
                .collect(Collectors.toMap(Advertiser::getId, Function.identity()));
        return Optional.of(new PlacementRotation(placement.get().getWidth(), placement.get().getHeight(), ordered,
                advertisers));
    }
}
