package pe.plataformacontenidos.content.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleStatus;
import pe.plataformacontenidos.content.ArticleType;
import pe.plataformacontenidos.content.MemorableDate;
import pe.plataformacontenidos.shared.ContentImageResponse;
import pe.plataformacontenidos.shared.ContentVideoResponse;

public record ArticleResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String body,
        ArticleType articleType,
        ArticleStatus status,
        UUID authorId,
        UUID categoryId,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentImageResponse> images,
        List<ContentVideoResponse> videos,
        String robots,
        String rejectionReason,
        Instant publishedAt,
        Instant scheduledAt,
        Instant createdAt,
        Instant updatedAt,
        long likeCount,
        Integer memorableDay,
        Integer memorableMonth,
        Integer memorableYear) {

    public static ArticleResponse from(Article article, long likeCount) {
        MemorableDate memorable = article.getMemorableDate();
        return new ArticleResponse(article.getId(), article.getSlug(), article.getTitle(), article.getExcerpt(),
                article.getBody(), article.getArticleType(), article.getStatus(), article.getAuthorId(),
                article.getCategoryId(), article.getSeoTitle(),
                article.getMetaDescription(), article.getCanonicalUrl(), article.getOgImageUrl(),
                article.getImages().stream().map(ContentImageResponse::from).toList(),
                article.getVideos().stream().map(ContentVideoResponse::from).toList(), article.getRobots(),
                article.getRejectionReason(), article.getPublishedAt(), article.getScheduledAt(),
                article.getCreatedAt(), article.getUpdatedAt(), likeCount,
                memorable == null ? null : memorable.day(), memorable == null ? null : memorable.month(),
                memorable == null ? null : memorable.year());
    }

    /** Para contextos sin conteo de "me gusta" calculado (admin). */
    public static ArticleResponse from(Article article) {
        return from(article, 0);
    }
}
