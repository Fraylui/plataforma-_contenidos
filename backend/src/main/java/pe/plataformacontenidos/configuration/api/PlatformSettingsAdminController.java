package pe.plataformacontenidos.configuration.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.configuration.PlatformSettingsService;
import pe.plataformacontenidos.configuration.api.dto.PlatformSettingsResponse;
import pe.plataformacontenidos.configuration.api.dto.UpdatePlatformSettingsRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Edición de la configuración de marca (CONTEXTO.md sección 14). Restringido
 * a SUPER_ADMIN/ADMIN en SecurityConfig — es configuración crítica de
 * identidad, no contenido editorial (sección 36.4: distinta de
 * ADMIN_CONTENIDO).
 */
@RestController
@RequestMapping("/api/v1/admin/platform-settings")
public class PlatformSettingsAdminController {

    private final PlatformSettingsService platformSettingsService;

    public PlatformSettingsAdminController(PlatformSettingsService platformSettingsService) {
        this.platformSettingsService = platformSettingsService;
    }

    @GetMapping
    public PlatformSettingsResponse get() {
        return PlatformSettingsResponse.from(platformSettingsService.get());
    }

    @PutMapping
    public PlatformSettingsResponse update(@Valid @RequestBody UpdatePlatformSettingsRequest request,
            @AuthenticationPrincipal UserPrincipal actingAdmin, HttpServletRequest httpRequest) {
        var saved = platformSettingsService.update(request, actingAdmin.userId(), httpRequest.getRemoteAddr());
        return PlatformSettingsResponse.from(saved);
    }
}
