package pe.plataformacontenidos.stats;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.identity.UserAdminService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.stats.api.dto.DailyCountResponse;
import pe.plataformacontenidos.stats.api.dto.PlatformStatsResponse;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Estadísticas básicas (CONTEXTO.md sección 34). Agrega contadores de otros
 * módulos exclusivamente a través de sus servicios públicos — nunca toca un
 * repositorio ajeno directamente (sección 38). No hay tracking de vistas
 * todavía (eso es un pipeline de eventos aparte, fuera del alcance de
 * "básicas"): esto es una fotografía del estado del contenido/operativo actual.
 */
@Service
public class StatsService {

    private static final int RECENT_WINDOW_DAYS = 30;

    private final ArticleService articleService;
    private final PlaceService placeService;
    private final EventService eventService;
    private final GalleryService galleryService;
    private final BusinessService businessService;
    private final CategoryService categoryService;
    private final UserAdminService userAdminService;

    public StatsService(ArticleService articleService, PlaceService placeService, EventService eventService,
            GalleryService galleryService, BusinessService businessService,
            CategoryService categoryService, UserAdminService userAdminService) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.galleryService = galleryService;
        this.businessService = businessService;
        this.categoryService = categoryService;
        this.userAdminService = userAdminService;
    }

    public PlatformStatsResponse snapshot() {
        Instant recentThreshold = Instant.now().minus(RECENT_WINDOW_DAYS, ChronoUnit.DAYS);
        return new PlatformStatsResponse(
                articleService.countByStatus(),
                articleService.countPublishedSince(recentThreshold),
                trend(articleService.publishedCountsByDaySince(recentThreshold)),
                placeService.countByStatus(),
                eventService.countByStatus(),
                galleryService.countByStatus(),
                businessService.countByStatus(),
                categoryService.countAll(),
                categoryService.countActive(),
                userAdminService.countByRole(),
                userAdminService.countActive());
    }

    /** Completa con 0 los días sin publicaciones — el gráfico de tendencia necesita los RECENT_WINDOW_DAYS puntos, no solo los que tuvieron actividad. */
    private List<DailyCountResponse> trend(Map<LocalDate, Long> countsByDay) {
        List<DailyCountResponse> result = new ArrayList<>(RECENT_WINDOW_DAYS);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = RECENT_WINDOW_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            result.add(new DailyCountResponse(day.toString(), countsByDay.getOrDefault(day, 0L)));
        }
        return result;
    }
}
