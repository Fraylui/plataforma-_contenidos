package pe.plataformacontenidos.stats.api.dto;

import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import java.util.List;
import java.util.Map;
import pe.plataformacontenidos.identity.Role;

/** CONTEXTO.md sección 34. Ver StatsService — pura agregación, sin persistencia propia. */
public record PlatformStatsResponse(
        Map<PublicationStatus, Long> articlesByStatus,
        long articlesPublishedLast30Days,
        List<DailyCountResponse> publishedTrendLast30Days,
        Map<PublicationStatus, Long> placesByStatus,
        Map<PublicationStatus, Long> eventsByStatus,
        Map<PublicationStatus, Long> galleriesByStatus,
        Map<PublicationStatus, Long> businessesByStatus,
        long totalCategories,
        long activeCategories,
        Map<Role, Long> usersByRole,
        long activeUsers) {
}
