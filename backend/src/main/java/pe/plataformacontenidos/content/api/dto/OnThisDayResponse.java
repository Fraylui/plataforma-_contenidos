package pe.plataformacontenidos.content.api.dto;

import java.time.LocalDate;
import pe.plataformacontenidos.content.ArticleService.OnThisDay;

/**
 * Un contenido de "Un día como hoy". {@code daysUntil} 0 = hoy;
 * {@code occurrence} es el día del calendario en que se recuerda (útil
 * para el 29 de febrero, que en años no bisiestos cae el 28);
 * {@code yearsAgo} es null si no se conoce el año original.
 */
public record OnThisDayResponse(ArticleSummaryResponse article, int daysUntil, LocalDate occurrence, Integer yearsAgo) {

    public static OnThisDayResponse from(OnThisDay item, long likeCount) {
        return new OnThisDayResponse(ArticleSummaryResponse.from(item.article(), likeCount), item.daysUntil(),
                item.occurrence(), item.yearsAgo());
    }
}
