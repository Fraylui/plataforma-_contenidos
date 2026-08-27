package pe.plataformacontenidos.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.search.api.dto.SearchPageResponse;
import pe.plataformacontenidos.search.api.dto.SearchResultResponse;

/**
 * Búsqueda unificada (CONTEXTO.md sección 16 y 20): agrega resultados de
 * Content y Places a través de sus servicios públicos, nunca por join SQL
 * directo entre esquemas (sección 38). Cada módulo sigue rankeando sus
 * propios resultados por ts_rank (relevancia de texto); entre tipos de
 * contenido distintos ese puntaje no es directamente comparable (viene de
 * columnas tsvector separadas), así que la fusión ordena por fecha de
 * publicación — más simple y honesto que fingir una relevancia cruzada que
 * no existe.
 */
@Service
public class SearchService {

    // Techo de resultados por tipo antes de fusionar y paginar en memoria.
    // Suficiente para el volumen de contenido del MVP; si esto se vuelve un
    // cuello de botella real, es la señal de migrar a OpenSearch/Elasticsearch
    // (sección 16), no de optimizar este merge.
    private static final int MERGE_FETCH_LIMIT = 200;

    private final ArticleService articleService;
    private final PlaceService placeService;
    private final EventService eventService;

    public SearchService(ArticleService articleService, PlaceService placeService, EventService eventService) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
    }

    /** `type` es opcional: cuando viene, solo se consulta ese módulo (no se pide trabajo de más al otro). */
    public SearchPageResponse search(String query, int page, int size, SearchResultType type) {
        if (query == null || query.isBlank()) {
            return new SearchPageResponse(List.of(), page, size, 0, 0);
        }

        List<SearchResultResponse> combined = new ArrayList<>();
        if (type == null || type == SearchResultType.ARTICLE) {
            articleService.search(query, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(a -> combined.add(SearchResultResponse.fromArticle(a)));
        }
        if (type == null || type == SearchResultType.PLACE) {
            placeService.search(query, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(p -> combined.add(SearchResultResponse.fromPlace(p)));
        }
        if (type == null || type == SearchResultType.EVENT) {
            eventService.search(query, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(e -> combined.add(SearchResultResponse.fromEvent(e)));
        }
        combined.sort(Comparator.comparing(SearchResultResponse::publishedAt).reversed());

        int total = combined.size();
        int totalPages = size == 0 ? 0 : (int) Math.ceil(total / (double) size);
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<SearchResultResponse> pageItems = combined.subList(from, to);

        return new SearchPageResponse(pageItems, page, size, total, totalPages);
    }
}
