package pe.plataformacontenidos.content.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleType;

/** Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md 43). */
public record ArticleSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        ArticleType articleType,
        UUID categoryId,
        UUID geographyId,
        UUID featuredImageId,
        boolean hasVideo,
        Instant publishedAt) {

    public static ArticleSummaryResponse from(Article article) {
        return new ArticleSummaryResponse(article.getId(), article.getSlug(), article.getTitle(),
                article.getExcerpt(), article.getArticleType(), article.getCategoryId(), article.getGeographyId(),
                article.getFeaturedImageId(), article.getYoutubeVideoId() != null, article.getPublishedAt());
    }
}
