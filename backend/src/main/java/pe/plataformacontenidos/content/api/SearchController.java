package pe.plataformacontenidos.content.api;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.content.api.dto.ArticleSummaryResponse;
import pe.plataformacontenidos.content.api.dto.PageResponse;

/**
 * Búsqueda interna (CONTEXTO.md sección 16). Vive en el módulo Content
 * porque hoy Article es el único tipo de contenido buscable (sección 3);
 * cuando existan Lugares/Eventos/Directorio, esto se separa a un módulo
 * Search propio que agregue resultados de varios módulos (sección 20: la
 * separación se hace cuando hay necesidad real, no antes).
 */
@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ArticleService articleService;

    public SearchController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public PageResponse<ArticleSummaryResponse> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var result = articleService.search(q, PageRequest.of(page, safeSize));
        return PageResponse.from(result, ArticleSummaryResponse::from);
    }
}
