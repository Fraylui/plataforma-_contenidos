package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
import pe.plataformacontenidos.shared.YouTubeUrlParser;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.InvalidTraffic;
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
 * <li><b>Formatos</b>: banner (a la medida de la posición) o anuncio nativo
 * del feed ({@link NativeAd}: texto, foto o video de YouTube y botón), que
 * solo va en {@link #FEED_PLACEMENT_KEY} y cuenta reproducciones
 * ({@link #recordPlay}).</li>
 * </ol>
 */
@Service
@Transactional
public class CampaignService {

    /** Tolerancia de proporción al validar la creatividad contra la medida de la posición (redondeos de exportación). */
    private static final double ASPECT_TOLERANCE = 0.02;

    /** Campañas activas que pueden competir por el mismo público (posición + segmentación + fechas). */
    public static final int MAX_COMPETING_CAMPAIGNS = 5;

    /** Única posición donde va el anuncio nativo: el feed (V45). */
    public static final String FEED_PLACEMENT_KEY = "en-feed";

    static final int NATIVE_TEXT_MAX = 500;
    static final int NATIVE_HEADLINE_MAX = 60;
    /** Ancho mínimo de la foto de un nativo: va a todo el ancho del post (recomendado 1080). */
    static final int NATIVE_IMAGE_MIN_WIDTH = 600;

    /** Proporciones de feed aceptadas para la foto (ancho / alto), como en Meta: cuadrada, vertical 4:5 y horizontal. */
    private static final Map<String, Double> NATIVE_IMAGE_ASPECTS = Map.of("1:1", 1.0, "4:5", 0.8, "1.91:1", 1.91);

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

    /**
     * Lo que se le entrega al navegador para una posición: su medida, las
     * campañas en el orden a usar y sus anunciantes (nombre y logo del
     * anuncio nativo), cargados en una sola consulta.
     */
    public record PlacementRotation(int width, int height, List<Campaign> campaigns,
            Map<UUID, Advertiser> advertisers) {
    }

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

    /** Creatividad y nativo ya validados, y la posición donde va. */
    private record ValidatedCreative(String placementKey, ContentImage creative, NativeAd nativeAd) {
    }

    public Campaign create(UUID advertiserId, CampaignDraft draft) {
        requireAdvertiserExists(advertiserId);
        ValidatedCreative valid = validate(draft);
        // Una campaña nueva nace activa: ocupa cupo desde ya.
        requireInventory(null, valid.placementKey(), draft.startsAt(), draft.endsAt(), draft.targeting());
        Campaign campaign = new Campaign(advertiserId, valid.placementKey(), valid.creative(), draft.linkUrl().strip(),
                draft.startsAt(), draft.endsAt(), draft.amount(), draft.currency(),
                draft.weight() != null ? draft.weight() : Campaign.DEFAULT_WEIGHT, draft.targeting());
        campaign.setNativeAd(valid.nativeAd());
        campaign.confirmCompliance();
        return campaignRepository.save(campaign);
    }

    public Campaign update(UUID id, CampaignDraft draft) {
        Campaign campaign = getOrThrow(id);
        ValidatedCreative valid = validate(draft);
        if (campaign.isActive()) {
            requireInventory(id, valid.placementKey(), draft.startsAt(), draft.endsAt(), draft.targeting());
        }
        campaign.update(valid.placementKey(), valid.creative(), draft.linkUrl().strip(), draft.startsAt(),
                draft.endsAt(), draft.amount(), draft.currency(),
                draft.weight() != null ? draft.weight() : campaign.getWeight(), draft.targeting());
        campaign.setNativeAd(valid.nativeAd());
        campaign.confirmCompliance();
        return campaignRepository.save(campaign);
    }

    private ValidatedCreative validate(CampaignDraft draft) {
        if (!draft.complianceConfirmed()) {
            throw new CampaignComplianceRequiredException();
        }
        requireValidSchedule(draft.startsAt(), draft.endsAt());
        requireValidAmount(draft.amount());
        requireExistingCategories(draft.targeting());
        requireWebLink(draft.linkUrl());
        if (draft.format() == CampaignFormat.NATIVE) {
            if (draft.placementKey() != null && !draft.placementKey().isBlank()
                    && !FEED_PLACEMENT_KEY.equals(draft.placementKey())) {
                throw new InvalidCampaignFormatException("El post patrocinado solo va dentro del feed.");
            }
            requirePlacement(FEED_PLACEMENT_KEY);
            return validateNative(draft.nativeAd(), draft.creative());
        }
        if (draft.placementKey() == null || draft.placementKey().isBlank()) {
            throw new InvalidCampaignFormatException("Elige el espacio donde va el banner.");
        }
        AdPlacement placement = requirePlacement(draft.placementKey());
        return new ValidatedCreative(draft.placementKey(), validateCreative(draft.creative(), placement), null);
    }

    /** Texto y botón obligatorios; exactamente un medio: foto subida con proporción de feed o video de YouTube. */
    private ValidatedCreative validateNative(NativeAdInput input, ContentImageInput image) {
        if (input == null || input.primaryText() == null || input.primaryText().isBlank()) {
            throw new InvalidCampaignFormatException("Escribe el texto del anuncio.");
        }
        String text = input.primaryText().strip();
        String headline = input.headline() == null || input.headline().isBlank() ? null : input.headline().strip();
        if (text.length() > NATIVE_TEXT_MAX) {
            throw new InvalidCampaignFormatException("El texto del anuncio admite hasta " + NATIVE_TEXT_MAX + " caracteres.");
        }
        if (headline != null && headline.length() > NATIVE_HEADLINE_MAX) {
            throw new InvalidCampaignFormatException("El titular admite hasta " + NATIVE_HEADLINE_MAX + " caracteres.");
        }
        if (input.callToAction() == null) {
            throw new InvalidCampaignFormatException("Elige el botón del anuncio.");
        }
        boolean hasVideo = input.videoUrl() != null && !input.videoUrl().isBlank();
        boolean hasImage = image != null && (image.hasImageId() || image.hasExternalUrl());
        if (hasVideo == hasImage) {
            throw new InvalidCampaignFormatException("El anuncio lleva una foto o un video de YouTube (uno de los dos).");
        }
        if (hasVideo) {
            String videoId = YouTubeUrlParser.extractVideoId(input.videoUrl().strip())
                    .orElseThrow(() -> new InvalidCampaignFormatException("Pega el link de un video de YouTube."));
            String aspect = input.videoUrl().contains("/shorts/") ? "9:16" : "16:9";
            return new ValidatedCreative(FEED_PLACEMENT_KEY, null,
                    new NativeAd(text, headline, input.callToAction(), videoId, aspect));
        }
        if (!image.hasImageId() || image.hasExternalUrl()) {
            throw new InvalidCampaignFormatException("Sube la foto a la biblioteca: así se comprueba su medida.");
        }
        String aspect = nativeImageAspect(imageService.getOrThrow(image.imageId()));
        return new ValidatedCreative(FEED_PLACEMENT_KEY, ContentImage.uploaded(image.imageId(), image.title(), null),
                new NativeAd(text, headline, input.callToAction(), null, aspect));
    }

    private static String nativeImageAspect(Image image) {
        double actual = (double) image.getWidth() / image.getHeight();
        String aspect = NATIVE_IMAGE_ASPECTS.entrySet().stream()
                .filter(e -> Math.abs(actual - e.getValue()) / e.getValue() <= ASPECT_TOLERANCE)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElseThrow(() -> new InvalidCampaignFormatException(String.format(
                        "La foto mide %d×%d px: para el feed tiene que ser cuadrada (1080×1080), vertical 4:5 "
                                + "(1080×1350) u horizontal (1200×628).", image.getWidth(), image.getHeight())));
        if (image.getWidth() < NATIVE_IMAGE_MIN_WIDTH) {
            throw new InvalidCampaignFormatException(String.format(
                    "La foto mide %d px de ancho: necesita al menos %d (recomendado 1080) para verse nítida.",
                    image.getWidth(), NATIVE_IMAGE_MIN_WIDTH));
        }
        return aspect;
    }

    /** El clic redirige a este link: solo una web (http/https; vale https://wa.me/…), nunca javascript: ni otros esquemas. */
    private static void requireWebLink(String linkUrl) {
        try {
            URI uri = new URI(linkUrl == null ? "" : linkUrl.strip());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if ((!scheme.equals("https") && !scheme.equals("http")) || uri.getHost() == null) {
                throw new InvalidCampaignFormatException("El destino tiene que ser una web (https://…).");
            }
        } catch (URISyntaxException e) {
            throw new InvalidCampaignFormatException("El destino tiene que ser una web (https://…).");
        }
    }

    /** Dominio que se muestra en la barra del nativo («polleriaelinca.pe»), sin «www.». */
    public static String displayDomain(String linkUrl) {
        try {
            String host = new URI(linkUrl).getHost();
            if (host == null) {
                return null;
            }
            return host.toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
        } catch (URISyntaxException e) {
            return null;
        }
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
        Map<UUID, Advertiser> advertisers = advertiserRepository
                .findAllById(ordered.stream().map(Campaign::getAdvertiserId).distinct().toList()).stream()
                .collect(Collectors.toMap(Advertiser::getId, Function.identity()));
        return Optional.of(new PlacementRotation(placement.get().getWidth(), placement.get().getHeight(), ordered,
                advertisers));
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
            dailyStatRepository.add(id, today(), 1, 0, 0);
        }
    }

    /** Devuelve a dónde redirigir — siempre; el clic solo se cuenta si es válido. El link real nunca va en el HTML. */
    public String recordClickAndGetLinkUrl(UUID id, String clientIp, String userAgent) {
        Campaign campaign = getOrThrow(id);
        if (!InvalidTraffic.isAutomated(userAgent)
                && deliveryGuard.acceptClick(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementClicks(id);
            dailyStatRepository.add(id, today(), 0, 1, 0);
        }
        return campaign.getLinkUrl();
    }

    /** El visitante tocó play en el video de un anuncio nativo. Robots, repeticiones y no vigentes no cuentan. */
    public void recordPlay(UUID id, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        Optional<Campaign> campaign = campaignRepository.findById(id);
        boolean playable = campaign.map(c -> c.isCurrentlyServable(Instant.now()) && c.getNativeAd() != null
                && c.getNativeAd().youtubeVideoId() != null).orElse(false);
        if (playable && deliveryGuard.acceptPlay(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementPlays(id);
            dailyStatRepository.add(id, today(), 0, 0, 1);
        }
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
