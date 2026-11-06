package pe.plataformacontenidos.configuration.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Vacío o ausente en un enlace opcional = no se muestra. */
public record UpdatePlatformSettingsRequest(
        @NotBlank String name,
        String description,
        String logoUrl,
        String logoDarkUrl,
        String faviconUrl,
        String ogImageUrl,
        String seoDefaultTitle,
        String googleSearchConsoleVerification,
        @Email String contactEmail,
        boolean adsenseEnabled,
        String adsenseClientId,
        String analyticsId,
        /** País del sitio, ISO de 2 letras. Ausente = se mantiene el actual. */
        @Pattern(regexp = "[A-Za-z]{2}", message = "homeCountry debe ser un código de país de 2 letras") String homeCountry,
        /** Solo enlaces de canal: nada de un número personal. */
        @Pattern(regexp = "\\s*|https://(www\\.)?whatsapp\\.com/channel/[A-Za-z0-9]+/?",
                message = "Pega el enlace del canal: https://whatsapp.com/channel/…") String whatsappChannelUrl,
        @Size(max = 300) @Pattern(regexp = "\\s*|https://(www\\.|m\\.)?(youtube\\.com|youtu\\.be)/\\S+",
                message = "Pega el enlace de tu canal de YouTube: https://youtube.com/@…") String youtubeUrl,
        @Size(max = 300) @Pattern(regexp = "\\s*|https://(www\\.)?instagram\\.com/\\S+",
                message = "Pega el enlace de tu perfil de Instagram: https://instagram.com/…") String instagramUrl,
        @Size(max = 300) @Pattern(regexp = "\\s*|https://(www\\.)?tiktok\\.com/@\\S+",
                message = "Pega el enlace de tu perfil de TikTok: https://tiktok.com/@…") String tiktokUrl,
        @Size(max = 300) @Pattern(regexp = "\\s*|https://(www\\.|m\\.)?(facebook\\.com|fb\\.com)/\\S+",
                message = "Pega el enlace de tu página de Facebook: https://facebook.com/…") String facebookUrl,
        @Size(max = 300) @Pattern(regexp = "\\s*|https://(www\\.)?(x\\.com|twitter\\.com)/\\S+",
                message = "Pega el enlace de tu perfil de X: https://x.com/…") String xUrl) {
}
