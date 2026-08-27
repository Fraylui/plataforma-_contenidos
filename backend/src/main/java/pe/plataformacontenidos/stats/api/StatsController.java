package pe.plataformacontenidos.stats.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.stats.StatsService;
import pe.plataformacontenidos.stats.api.dto.PlatformStatsResponse;

/** Panel de estadísticas básicas (CONTEXTO.md sección 11/34). Restringido en SecurityConfig. */
@RestController
@RequestMapping("/api/v1/admin/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public PlatformStatsResponse get() {
        return statsService.snapshot();
    }
}
