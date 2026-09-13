package pe.plataformacontenidos.content.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleType;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md
 * 43). coverImageId/coverImageUrl son excluyentes (ver ContentImage): la
 * primera imagen de la publicación, subida o por enlace externo.
 */
public record ArticleSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        ArticleType articleType,
        UUID categoryId,
        UUID geographyId,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        long likeCount) {

    public static ArticleSummaryResponse from(Article article, long likeCount) {
        ContentImage cover = article.getCoverImage();
        return new ArticleSummaryResponse(article.getId(), article.getSlug(), article.getTitle(),
                article.getExcerpt(), article.getArticleType(), article.getCategoryId(), article.getGeographyId(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !article.getYoutubeVideoIds().isEmpty(), article.getPublishedAt(), likeCount);
    }
}
