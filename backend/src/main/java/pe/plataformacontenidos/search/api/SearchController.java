package pe.plataformacontenidos.search.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.search.SearchResultType;
import pe.plataformacontenidos.search.SearchService;
import pe.plataformacontenidos.search.api.dto.SearchPageResponse;

/** Búsqueda interna (CONTEXTO.md sección 16), sobre todos los tipos de contenido buscables (hoy: Artículos y Lugares). */
@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private static final int MAX_PAGE_SIZE = 50;

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchPageResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) SearchResultType type) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return searchService.search(q, Math.max(page, 0), safeSize, type);
    }
}
