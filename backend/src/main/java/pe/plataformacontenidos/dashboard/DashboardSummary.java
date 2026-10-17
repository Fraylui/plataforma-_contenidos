package pe.plataformacontenidos.dashboard;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.engagement.ContentType;

/**
 * Lo que dibuja el inicio del panel (ver DashboardService). Los indicadores
 * traen el período anterior del mismo largo para calcular la variación.
 * {@code ads} es null si el usuario no tiene el módulo de publicidad.
 */
public record DashboardSummary(
        int rangeDays,
        String from,
        String to,
        Kpi views,
        Kpi likes,
        Kpi published,
        List<DailyPoint> series,
        List<TopRow> topViewed,
        Map<ContentType, Map<String, Long>> byTypeAndStatus,
        List<ContentRow> recent,
        AdTotals ads) {

    public record Kpi(long current, long previous) {
    }

    public record DailyPoint(String day, long views, long likes, long published) {
    }

    public record TopRow(ContentType type, UUID id, String title, String slug, long views) {
    }

    public record ContentRow(ContentType type, UUID id, String title, String status, Instant createdAt) {
    }

    public record AdTotals(long impressions, long clicks, long previousImpressions, long previousClicks) {
    }
}
