package pe.plataformacontenidos.advertising;

/**
 * Lo propio de un anuncio nativo, ya validado (CampaignService): texto,
 * titular opcional, botón y el medio — foto subida (en la creatividad de la
 * campaña) o video de YouTube ({@code youtubeVideoId}) — con su proporción.
 */
public record NativeAd(String primaryText, String headline, CallToAction callToAction, String youtubeVideoId,
        String mediaAspect) {
}
