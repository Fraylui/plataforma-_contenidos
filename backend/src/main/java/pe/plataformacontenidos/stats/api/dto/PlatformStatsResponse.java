package pe.plataformacontenidos.stats.api.dto;

import java.util.Map;
import pe.plataformacontenidos.content.ArticleStatus;
import pe.plataformacontenidos.identity.Role;

/** CONTEXTO.md sección 34. Ver StatsService — pura agregación, sin persistencia propia. */
public record PlatformStatsResponse(
        Map<ArticleStatus, Long> articlesByStatus,
        long articlesPublishedLast30Days,
        long totalCategories,
        long activeCategories,
        long totalTags,
        long totalGeographyUnits,
        long activeGeographyUnits,
        Map<Role, Long> usersByRole,
        long activeUsers) {
}
