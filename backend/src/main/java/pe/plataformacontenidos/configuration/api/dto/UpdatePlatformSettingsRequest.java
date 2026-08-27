package pe.plataformacontenidos.configuration.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePlatformSettingsRequest(
        @NotBlank String name,
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
        @NotBlank @Pattern(regexp = "LIGHT|DARK|AUTO", message = "theme debe ser LIGHT, DARK o AUTO") String theme,
        String seoDefaultTitle,
        String seoDefaultDescription,
        String seoDefaultImageUrl,
        String googleSearchConsoleVerification,
        String facebookUrl,
        String instagramUrl,
        String tiktokUrl,
        String youtubeUrl,
        @Email String contactEmail,
        String contactPhone,
        String contactAddress,
        boolean adsenseEnabled,
        String adsenseClientId,
        String analyticsId) {
}
