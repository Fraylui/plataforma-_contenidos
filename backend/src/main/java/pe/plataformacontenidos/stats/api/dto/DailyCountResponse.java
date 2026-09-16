package pe.plataformacontenidos.stats.api.dto;

/** Un punto del gráfico de tendencia de Estadísticas — ver StatsService. */
public record DailyCountResponse(String date, long count) {
}
