package pe.plataformacontenidos.configuration.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.configuration.PlatformSettingsService;
import pe.plataformacontenidos.configuration.api.dto.PlatformSettingsResponse;

/** Lectura pública: consumida por el frontend público y el layout del admin (nombre, logo, SEO por defecto). */
@RestController
@RequestMapping("/api/v1")
public class PlatformSettingsController {

    private final PlatformSettingsService platformSettingsService;

    public PlatformSettingsController(PlatformSettingsService platformSettingsService) {
        this.platformSettingsService = platformSettingsService;
    }

    @GetMapping("/platform-settings")
    public PlatformSettingsResponse get() {
        return PlatformSettingsResponse.from(platformSettingsService.get());
    }
}
