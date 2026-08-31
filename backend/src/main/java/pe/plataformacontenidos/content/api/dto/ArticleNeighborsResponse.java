package pe.plataformacontenidos.content.api.dto;

import pe.plataformacontenidos.content.ArticleService.ArticleNeighbors;

public record ArticleNeighborsResponse(ArticleSummaryResponse previous, ArticleSummaryResponse next) {

    public static ArticleNeighborsResponse from(ArticleNeighbors neighbors) {
        return new ArticleNeighborsResponse(
                neighbors.previous() == null ? null : ArticleSummaryResponse.from(neighbors.previous()),
                neighbors.next() == null ? null : ArticleSummaryResponse.from(neighbors.next()));
    }
}
