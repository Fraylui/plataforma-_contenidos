package pe.plataformacontenidos.configuration.api.dto;

import pe.plataformacontenidos.configuration.PlatformSettings;

/** Misma forma para la lectura pública y la del admin: nada aquí es secreto (ver PlatformSettingsService). */
public record PlatformSettingsResponse(
        String name,
        String shortName,
        String description,
        String slogan,
        String logoUrl,
        String logoDarkUrl,
        String faviconUrl,
        String ogImageUrl,
        String primaryColor,
        String secondaryColor,
        String backgroundColor,
        String fontFamily,
        String theme,
        String seoDefaultTitle,
        String seoDefaultDescription,
        String seoDefaultImageUrl,
        String googleSearchConsoleVerification,
        String facebookUrl,
        String instagramUrl,
        String tiktokUrl,
        String youtubeUrl,
        String contactEmail,
        String contactPhone,
        String contactAddress,
        boolean adsenseEnabled,
        String adsenseClientId,
        String analyticsId,
        String adsenseSlotArticle,
        String adsenseSlotListing) {

    public static PlatformSettingsResponse from(PlatformSettings settings) {
        return new PlatformSettingsResponse(
                settings.getName(),
                settings.getShortName(),
                settings.getDescription(),
                settings.getSlogan(),
                settings.getLogoUrl(),
                settings.getLogoDarkUrl(),
                settings.getFaviconUrl(),
                settings.getOgImageUrl(),
                settings.getPrimaryColor(),
                settings.getSecondaryColor(),
                settings.getBackgroundColor(),
                settings.getFontFamily(),
                settings.getTheme(),
                settings.getSeoDefaultTitle(),
                settings.getSeoDefaultDescription(),
                settings.getSeoDefaultImageUrl(),
                settings.getGoogleSearchConsoleVerification(),
                settings.getFacebookUrl(),
                settings.getInstagramUrl(),
                settings.getTiktokUrl(),
                settings.getYoutubeUrl(),
                settings.getContactEmail(),
                settings.getContactPhone(),
                settings.getContactAddress(),
                settings.isAdsenseEnabled(),
                settings.getAdsenseClientId(),
                settings.getAnalyticsId(),
                settings.getAdsenseSlotArticle(),
                settings.getAdsenseSlotListing());
    }
}
