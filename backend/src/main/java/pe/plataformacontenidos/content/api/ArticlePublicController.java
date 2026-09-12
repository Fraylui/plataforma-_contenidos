package pe.plataformacontenidos.content.api;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.content.api.dto.ArticleNeighborsResponse;
import pe.plataformacontenidos.content.api.dto.ArticleResponse;
import pe.plataformacontenidos.content.api.dto.ArticleSummaryResponse;
import pe.plataformacontenidos.content.api.dto.PageResponse;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/articles")
public class ArticlePublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ArticleService articleService;
    private final ContentLikeService contentLikeService;

    public ArticlePublicController(ArticleService articleService, ContentLikeService contentLikeService) {
        this.articleService = articleService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<ArticleSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Clamp defensivo: page<0/size<1 lanzan IllegalArgumentException, y un page
        // extremo hace que offset (page*size) desborde Integer.MAX_VALUE en el
        // driver JDBC (InvalidDataAccessApiUsageException) — ambos son 500 en un
        // endpoint público sin autenticar. Ver ApiHardeningIntegrationTest.
        int safePage = Math.min(Math.max(page, 0), 10_000_000);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = articleService.listPublished(categoryId, geographyId, pageable);
        var likes = contentLikeService.countLikes(ContentType.ARTICLE,
                result.getContent().stream().map(Article::getId).toList());
        return PageResponse.from(result, item -> ArticleSummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    @GetMapping("/{slug}")
    public ArticleResponse getBySlug(@PathVariable String slug) {
        Article article = articleService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.ARTICLE, article.getId());
        return ArticleResponse.from(article, likeCount);
    }

    @GetMapping("/{slug}/neighbors")
    public ArticleNeighborsResponse getNeighbors(@PathVariable String slug) {
        Article article = articleService.getPublishedBySlug(slug);
        var neighbors = articleService.getNeighbors(article);
        List<UUID> ids = Stream.of(neighbors.previous(), neighbors.next()).filter(Objects::nonNull).map(Article::getId).toList();
        return ArticleNeighborsResponse.from(neighbors, contentLikeService.countLikes(ContentType.ARTICLE, ids));
    }

    /** visitorId es un UUID generado y persistido en el navegador del lector (no requiere cuenta) — ver ContentLike. */
    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Article article = articleService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.ARTICLE, article.getId(), visitorId));
    }
}
