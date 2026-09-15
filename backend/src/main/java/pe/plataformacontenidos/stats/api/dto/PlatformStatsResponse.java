package pe.plataformacontenidos.stats.api.dto;

import java.util.Map;
import pe.plataformacontenidos.content.ArticleStatus;
import pe.plataformacontenidos.directory.BusinessStatus;
import pe.plataformacontenidos.events.EventStatus;
import pe.plataformacontenidos.galleries.GalleryStatus;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.places.PlaceStatus;

/** CONTEXTO.md sección 34. Ver StatsService — pura agregación, sin persistencia propia. */
public record PlatformStatsResponse(
        Map<ArticleStatus, Long> articlesByStatus,
        long articlesPublishedLast30Days,
        Map<PlaceStatus, Long> placesByStatus,
        Map<EventStatus, Long> eventsByStatus,
        Map<GalleryStatus, Long> galleriesByStatus,
        Map<BusinessStatus, Long> businessesByStatus,
        long totalCategories,
        long activeCategories,
        Map<Role, Long> usersByRole,
        long activeUsers) {
}
