package pe.plataformacontenidos.configuration.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePlatformSettingsRequest(
        @NotBlank String name,
        String shortName,
        String description,
        String logoUrl,
        String logoDarkUrl,
        String faviconUrl,
        String ogImageUrl,
        String primaryColor,
        String secondaryColor,
        String backgroundColor,
        String fontFamily,
        String seoDefaultTitle,
        String seoDefaultDescription,
        String seoDefaultImageUrl,
        String googleSearchConsoleVerification,
        @Email String contactEmail,
        boolean adsenseEnabled,
        String adsenseClientId,
        String analyticsId,
        /** País del sitio, ISO de 2 letras. Ausente = se mantiene el actual. */
        @Pattern(regexp = "[A-Za-z]{2}", message = "homeCountry debe ser un código de país de 2 letras") String homeCountry) {
}
