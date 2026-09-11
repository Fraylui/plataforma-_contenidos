package pe.plataformacontenidos.content.api.dto;

import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.content.ArticleService.ArticleNeighbors;

public record ArticleNeighborsResponse(ArticleSummaryResponse previous, ArticleSummaryResponse next) {

    public static ArticleNeighborsResponse from(ArticleNeighbors neighbors, Map<UUID, Long> likes) {
        return new ArticleNeighborsResponse(
                neighbors.previous() == null ? null : ArticleSummaryResponse.from(neighbors.previous(), likes.getOrDefault(neighbors.previous().getId(), 0L)),
                neighbors.next() == null ? null : ArticleSummaryResponse.from(neighbors.next(), likes.getOrDefault(neighbors.next().getId(), 0L)));
    }
}
