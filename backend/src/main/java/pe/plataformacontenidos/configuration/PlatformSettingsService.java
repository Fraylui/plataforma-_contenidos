package pe.plataformacontenidos.configuration;

import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.configuration.api.dto.UpdatePlatformSettingsRequest;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;

/**
 * Fila única de configuración de marca (CONTEXTO.md sección 14). No hay
 * create/delete: solo lectura (público, vía PlatformSettingsController) y
 * actualización (admin, vía PlatformSettingsAdminController). Sin caché por
 * ahora — sigue el mismo patrón que taxonomy/geography (ver exploración
 * previa: no hay convención @Cacheable en el proyecto todavía); el frontend
 * ya cachea la lectura pública con ISR (revalidate).
 */
@Service
public class PlatformSettingsService {

    private final PlatformSettingsRepository repository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public PlatformSettingsService(PlatformSettingsRepository repository, UserRepository userRepository,
            AuditService auditService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public PlatformSettings get() {
        return repository.findFirstByOrderByIdAsc().orElseThrow(PlatformSettingsNotInitializedException::new);
    }

    public PlatformSettings update(UpdatePlatformSettingsRequest request, UUID actingAdminId, String ipAddress) {
        PlatformSettings settings = get();

        settings.setName(request.name());
        settings.setShortName(request.shortName());
        settings.setDescription(request.description());
        settings.setLogoUrl(request.logoUrl());
        settings.setLogoDarkUrl(request.logoDarkUrl());
        settings.setFaviconUrl(request.faviconUrl());
        settings.setOgImageUrl(request.ogImageUrl());

        settings.setPrimaryColor(request.primaryColor());
        settings.setSecondaryColor(request.secondaryColor());
        settings.setBackgroundColor(request.backgroundColor());
        settings.setFontFamily(request.fontFamily());
        settings.setTheme(request.theme());

        settings.setSeoDefaultTitle(request.seoDefaultTitle());
        settings.setSeoDefaultDescription(request.seoDefaultDescription());
        settings.setSeoDefaultImageUrl(request.seoDefaultImageUrl());
        settings.setGoogleSearchConsoleVerification(request.googleSearchConsoleVerification());

        settings.setContactEmail(request.contactEmail());

        settings.setAdsenseEnabled(request.adsenseEnabled());
        settings.setAdsenseClientId(request.adsenseClientId());
        settings.setAnalyticsId(request.analyticsId());
        settings.setAdsenseSlotArticle(request.adsenseSlotArticle());
        settings.setAdsenseSlotListing(request.adsenseSlotListing());

        settings.setUpdatedAt(Instant.now());
        settings.setUpdatedBy(actingAdminId);

        PlatformSettings saved = repository.save(settings);

        String actingAdminEmail = userRepository.findById(actingAdminId).map(User::getEmail).orElse(null);
        auditService.record("PLATFORM_SETTINGS_UPDATED", AuditResult.SUCCESS, actingAdminId, actingAdminEmail,
                "platform_settings", saved.getId().toString(), ipAddress);

        return saved;
    }
}
