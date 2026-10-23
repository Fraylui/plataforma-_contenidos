package pe.plataformacontenidos.configuration;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.configuration.api.dto.UpdatePlatformSettingsRequest;
import pe.plataformacontenidos.identity.UserDirectory;

/**
 * Fila única de configuración de marca (CONTEXTO.md sección 14). No hay
 * create/delete: solo lectura (público, vía PlatformSettingsController) y
 * actualización (admin, vía PlatformSettingsAdminController). Sin caché por
 * ahora — sigue el mismo patrón que taxonomy (ver exploración previa: no
 * hay convención @Cacheable en el proyecto todavía); el frontend
 * ya cachea la lectura pública con ISR (revalidate).
 */
@Service
public class PlatformSettingsService {

    private final PlatformSettingsRepository repository;
    private final UserDirectory users;
    private final AuditService auditService;

    public PlatformSettingsService(PlatformSettingsRepository repository, UserDirectory users,
            AuditService auditService) {
        this.repository = repository;
        this.users = users;
        this.auditService = auditService;
    }

    public PlatformSettings get() {
        return repository.findFirstByOrderByIdAsc().orElseThrow(PlatformSettingsNotInitializedException::new);
    }

    public PlatformSettings update(UpdatePlatformSettingsRequest request, UUID actingAdminId, String ipAddress) {
        PlatformSettings settings = get();

        settings.setName(request.name());
        settings.setDescription(request.description());
        settings.setLogoUrl(request.logoUrl());
        settings.setLogoDarkUrl(request.logoDarkUrl());
        settings.setFaviconUrl(request.faviconUrl());
        settings.setOgImageUrl(request.ogImageUrl());

        settings.setSeoDefaultTitle(request.seoDefaultTitle());
        settings.setGoogleSearchConsoleVerification(request.googleSearchConsoleVerification());

        settings.setContactEmail(request.contactEmail());

        settings.setAdsenseEnabled(request.adsenseEnabled());
        settings.setAdsenseClientId(request.adsenseClientId());
        settings.setAnalyticsId(request.analyticsId());
        settings.setWhatsappChannelUrl(link(request.whatsappChannelUrl()));
        settings.setYoutubeUrl(link(request.youtubeUrl()));
        settings.setInstagramUrl(link(request.instagramUrl()));
        settings.setTiktokUrl(link(request.tiktokUrl()));
        settings.setFacebookUrl(link(request.facebookUrl()));
        settings.setXUrl(link(request.xUrl()));
        if (request.homeCountry() != null) {
            settings.setHomeCountry(request.homeCountry().toUpperCase(Locale.ROOT));
        }

        settings.setUpdatedAt(Instant.now());
        settings.setUpdatedBy(actingAdminId);

        PlatformSettings saved = repository.save(settings);

        String actingAdminEmail = users.emailOf(actingAdminId).orElse(null);
        auditService.record("PLATFORM_SETTINGS_UPDATED", AuditResult.SUCCESS, actingAdminId, actingAdminEmail,
                "platform_settings", saved.getId().toString(), ipAddress);

        return saved;
    }

    /** Enlace opcional: vacío = null (no se muestra), si no, sin espacios alrededor. */
    private static String link(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
