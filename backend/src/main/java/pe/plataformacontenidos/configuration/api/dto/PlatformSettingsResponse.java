package pe.plataformacontenidos.configuration.api.dto;

import pe.plataformacontenidos.configuration.PlatformSettings;

/** Misma forma para la lectura pública y la del admin: nada aquí es secreto (ver PlatformSettingsService). */
public record PlatformSettingsResponse(
        String name,
        String description,
        String logoUrl,
        String logoDarkUrl,
        String faviconUrl,
        String ogImageUrl,
        String seoDefaultTitle,
        String googleSearchConsoleVerification,
        String contactEmail,
        boolean adsenseEnabled,
        String adsenseClientId,
        String analyticsId,
        String homeCountry,
        String whatsappChannelUrl,
        String youtubeUrl,
        String instagramUrl,
        String tiktokUrl,
        String facebookUrl,
        String xUrl) {

    public static PlatformSettingsResponse from(PlatformSettings settings) {
        return new PlatformSettingsResponse(
                settings.getName(),
                settings.getDescription(),
                settings.getLogoUrl(),
                settings.getLogoDarkUrl(),
                settings.getFaviconUrl(),
                settings.getOgImageUrl(),
                settings.getSeoDefaultTitle(),
                settings.getGoogleSearchConsoleVerification(),
                settings.getContactEmail(),
                settings.isAdsenseEnabled(),
                settings.getAdsenseClientId(),
                settings.getAnalyticsId(),
                settings.getHomeCountry(),
                settings.getWhatsappChannelUrl(),
                settings.getYoutubeUrl(),
                settings.getInstagramUrl(),
                settings.getTiktokUrl(),
                settings.getFacebookUrl(),
                settings.getXUrl());
    }
}
