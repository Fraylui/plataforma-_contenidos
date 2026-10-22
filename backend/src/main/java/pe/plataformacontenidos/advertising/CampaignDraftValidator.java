package pe.plataformacontenidos.advertising;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.advertising.CampaignService.CampaignDraft;
import pe.plataformacontenidos.advertising.CampaignService.NativeAdInput;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.YouTubeUrlParser;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Reglas de una campaña antes de guardarla: condiciones aceptadas, fechas,
 * monto, temas que existen, destino web y la creatividad — un banner a la
 * medida de su posición (IAB) o un nativo del feed con texto, botón y un solo
 * medio (foto con proporción de feed o video de YouTube). No guarda nada.
 */
@Component
class CampaignDraftValidator {

    /** Tolerancia de proporción al validar la creatividad contra la medida de la posición (redondeos de exportación). */
    private static final double ASPECT_TOLERANCE = 0.02;

    static final int NATIVE_TEXT_MAX = 500;
    static final int NATIVE_HEADLINE_MAX = 60;
    /** Ancho mínimo de la foto de un nativo: va a todo el ancho del post (recomendado 1080). */
    static final int NATIVE_IMAGE_MIN_WIDTH = 600;

    /** Proporciones de feed aceptadas para la foto (ancho / alto), como en Meta: cuadrada, vertical 4:5 y horizontal. */
    private static final Map<String, Double> NATIVE_IMAGE_ASPECTS = Map.of("1:1", 1.0, "4:5", 0.8, "1.91:1", 1.91);

    private final AdPlacementRepository adPlacementRepository;
    private final ImageService imageService;
    private final CategoryService categoryService;

    CampaignDraftValidator(AdPlacementRepository adPlacementRepository, ImageService imageService,
            CategoryService categoryService) {
        this.adPlacementRepository = adPlacementRepository;
        this.imageService = imageService;
        this.categoryService = categoryService;
    }

    /** Creatividad y nativo ya validados, y la posición donde va. */
    record ValidatedCreative(String placementKey, ContentImage creative, NativeAd nativeAd) {
    }

    ValidatedCreative validate(CampaignDraft draft) {
        if (!draft.complianceConfirmed()) {
            throw new CampaignComplianceRequiredException();
        }
        requireValidSchedule(draft.startsAt(), draft.endsAt());
        requireValidAmount(draft.amount());
        requireExistingCategories(draft.targeting());
        requireWebLink(draft.linkUrl());
        if (draft.format() == CampaignFormat.NATIVE) {
            if (draft.placementKey() != null && !draft.placementKey().isBlank()
                    && !NativeAd.FEED_PLACEMENT_KEY.equals(draft.placementKey())) {
                throw new InvalidCampaignFormatException("El post patrocinado solo va dentro del feed.");
            }
            requirePlacement(NativeAd.FEED_PLACEMENT_KEY);
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
            return new ValidatedCreative(NativeAd.FEED_PLACEMENT_KEY, null,
                    new NativeAd(text, headline, input.callToAction(), videoId, aspect));
        }
        if (!image.hasImageId() || image.hasExternalUrl()) {
            throw new InvalidCampaignFormatException("Sube la foto a la biblioteca: así se comprueba su medida.");
        }
        String aspect = nativeImageAspect(imageService.getOrThrow(image.imageId()));
        return new ValidatedCreative(NativeAd.FEED_PLACEMENT_KEY, ContentImage.uploaded(image.imageId(), image.title(), null),
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
