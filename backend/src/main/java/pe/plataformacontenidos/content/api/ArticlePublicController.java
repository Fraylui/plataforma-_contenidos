package pe.plataformacontenidos.content.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.content.api.dto.ArticleResponse;
import pe.plataformacontenidos.content.api.dto.ArticleSummaryResponse;
import pe.plataformacontenidos.content.api.dto.PageResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/articles")
public class ArticlePublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ArticleService articleService;

    public ArticlePublicController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public PageResponse<ArticleSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = articleService.listPublished(categoryId, geographyId, pageable);
        return PageResponse.from(result, ArticleSummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public ArticleResponse getBySlug(@PathVariable String slug) {
        return ArticleResponse.from(articleService.getPublishedBySlug(slug));
    }
}
