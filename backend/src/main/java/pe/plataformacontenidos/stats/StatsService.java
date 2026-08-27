package pe.plataformacontenidos.stats;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.geography.GeographicUnitService;
import pe.plataformacontenidos.identity.UserAdminService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.stats.api.dto.PlatformStatsResponse;
import pe.plataformacontenidos.taxonomy.CategoryService;
import pe.plataformacontenidos.taxonomy.TagService;

/**
 * Estadísticas básicas (CONTEXTO.md sección 34). Agrega contadores de otros
 * módulos exclusivamente a través de sus servicios públicos — nunca toca un
 * repositorio ajeno directamente (sección 38). No hay tracking de vistas
 * todavía (eso es un pipeline de eventos aparte, fuera del alcance de
 * "básicas"): esto es una fotografía del estado editorial/operativo actual.
 */
@Service
public class StatsService {

    private static final int RECENT_WINDOW_DAYS = 30;

    private final ArticleService articleService;
    private final PlaceService placeService;
    private final EventService eventService;
    private final GalleryService galleryService;
    private final CategoryService categoryService;
    private final TagService tagService;
    private final GeographicUnitService geographyService;
    private final UserAdminService userAdminService;

    public StatsService(ArticleService articleService, PlaceService placeService, EventService eventService,
            GalleryService galleryService, CategoryService categoryService, TagService tagService,
            GeographicUnitService geographyService, UserAdminService userAdminService) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.galleryService = galleryService;
        this.categoryService = categoryService;
        this.tagService = tagService;
        this.geographyService = geographyService;
        this.userAdminService = userAdminService;
    }

    public PlatformStatsResponse snapshot() {
        Instant recentThreshold = Instant.now().minus(RECENT_WINDOW_DAYS, ChronoUnit.DAYS);
        return new PlatformStatsResponse(
                articleService.countByStatus(),
                articleService.countPublishedSince(recentThreshold),
                placeService.countByStatus(),
                eventService.countByStatus(),
                galleryService.countByStatus(),
                categoryService.countAll(),
                categoryService.countActive(),
                tagService.countAll(),
                geographyService.countAll(),
                geographyService.countActive(),
                userAdminService.countByRole(),
                userAdminService.countActive());
    }
}
