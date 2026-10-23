package pe.plataformacontenidos.advertising;

/**
 * Lo propio de un anuncio nativo, ya validado (CampaignDraftValidator): texto,
 * titular opcional, botón y el medio — foto subida (en la creatividad de la
 * campaña) o video de YouTube ({@code youtubeVideoId}) — con su proporción.
 */
public record NativeAd(String primaryText, String headline, CallToAction callToAction, String youtubeVideoId,
        String mediaAspect) {

    /** Única posición donde va el anuncio nativo: el feed (V45). */
    public static final String FEED_PLACEMENT_KEY = "en-feed";
}
