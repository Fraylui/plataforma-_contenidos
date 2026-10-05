package pe.plataformacontenidos.search;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.search.api.dto.SearchPageResponse;
import pe.plataformacontenidos.search.api.dto.SearchResultResponse;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Búsqueda unificada (CONTEXTO.md sección 16 y 20): agrega resultados de
 * Content y Places a través de sus servicios públicos, nunca por join SQL
 * directo entre esquemas (sección 38). Cada módulo sigue rankeando sus
 * propios resultados por ts_rank (relevancia de texto); entre tipos de
 * contenido distintos ese puntaje no es directamente comparable (viene de
 * columnas tsvector separadas), así que la fusión ordena por fecha de
 * publicación — más simple y honesto que fingir una relevancia cruzada que
 * no existe. categoryId es el único filtro fino que aplica a los 6 tipos;
 * from/to (rango de fechas) solo tiene efecto en Evento, que es el único con
 * una fecha propia con sentido de filtro.
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
    private final GalleryService galleryService;
    private final BusinessService businessService;
    private final CategoryService categoryService;

    public SearchService(ArticleService articleService, PlaceService placeService, EventService eventService,
            GalleryService galleryService, BusinessService businessService, CategoryService categoryService) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.galleryService = galleryService;
        this.businessService = businessService;
        this.categoryService = categoryService;
    }

    /** `type` es opcional: cuando viene, solo se consulta ese módulo (no se pide trabajo de más al otro). */
    public SearchPageResponse search(String query, int page, int size, SearchResultType type, UUID categoryId,
            Instant from, Instant to) {
        if (query == null || query.isBlank()) {
            return new SearchPageResponse(List.of(), page, size, 0, 0);
        }

        List<SearchResultResponse> combined = new ArrayList<>();
        if (type == null || type == SearchResultType.ARTICLE) {
            articleService.search(query, categoryId, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(a -> combined.add(SearchResultResponse.fromArticle(a)));
        }
        if (type == null || type == SearchResultType.PLACE) {
            placeService.search(query, categoryId, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(p -> combined.add(SearchResultResponse.fromPlace(p)));
        }
        if (type == null || type == SearchResultType.EVENT) {
            eventService.search(query, categoryId, from, to, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(e -> combined.add(SearchResultResponse.fromEvent(e)));
        }
        if (type == null || type == SearchResultType.GALLERY) {
            galleryService.search(query, categoryId, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(g -> combined.add(SearchResultResponse.fromGallery(g)));
        }
        if (type == null || type == SearchResultType.BUSINESS) {
            businessService.search(query, categoryId, PageRequest.of(0, MERGE_FETCH_LIMIT))
                    .forEach(b -> combined.add(SearchResultResponse.fromBusiness(b)));
        }
        addCategoryMatches(combined, query, type, categoryId, from, to);
        combined.sort(Comparator.comparing(SearchResultResponse::publishedAt).reversed());

        int total = combined.size();
        int totalPages = size == 0 ? 0 : (int) Math.ceil(total / (double) size);
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<SearchResultResponse> pageItems = combined.subList(fromIndex, toIndex);

        return new SearchPageResponse(pageItems, page, size, total, totalPages);
    }

    /**
     * Suma el contenido de las categorías cuyo NOMBRE coincide con la
     * búsqueda: buscar "turismo" tiene que traer lo del tema Turismo aunque
     * su texto no diga "turismo" (antes daba 1 resultado de 15). Cada módulo
     * lista su propio contenido por categoría (sin join entre esquemas,
     * sección 38) y no se repite nada que ya vino por coincidencia de texto.
     * Respeta los mismos filtros que la búsqueda de texto: tipo, categoría y,
     * en eventos, el rango de fechas.
     */
    private void addCategoryMatches(List<SearchResultResponse> combined, String query, SearchResultType type,
            UUID categoryId, Instant from, Instant to) {
        List<UUID> categoryIds = categoryService.findActiveIdsMatchingName(query).stream()
                .filter(id -> categoryId == null || id.equals(categoryId))
                .toList();
        if (categoryIds.isEmpty()) {
            return;
        }
        Set<String> seen = new HashSet<>();
        combined.forEach(r -> seen.add(r.contentType() + ":" + r.id()));
        PageRequest pageable = PageRequest.of(0, MERGE_FETCH_LIMIT);

        for (UUID id : categoryIds) {
            if (type == null || type == SearchResultType.ARTICLE) {
                articleService.listPublished(id, pageable)
                        .forEach(a -> addIfNew(combined, seen, SearchResultResponse.fromArticle(a)));
            }
            if (type == null || type == SearchResultType.PLACE) {
                placeService.listPublished(id, pageable)
                        .forEach(p -> addIfNew(combined, seen, SearchResultResponse.fromPlace(p)));
            }
            if (type == null || type == SearchResultType.EVENT) {
                // Próximos y pasados: la búsqueda de texto tampoco distingue.
                for (boolean upcoming : new boolean[] {true, false}) {
                    eventService.listPublished(id, upcoming, pageable).stream()
                            .filter(e -> from == null || !e.getStartsAt().isBefore(from))
                            .filter(e -> to == null || !e.getStartsAt().isAfter(to))
                            .forEach(e -> addIfNew(combined, seen, SearchResultResponse.fromEvent(e)));
                }
            }
            if (type == null || type == SearchResultType.GALLERY) {
                galleryService.listPublished(id, pageable)
                        .forEach(g -> addIfNew(combined, seen, SearchResultResponse.fromGallery(g)));
            }
            if (type == null || type == SearchResultType.BUSINESS) {
                businessService.listPublished(id, null, pageable)
                        .forEach(b -> addIfNew(combined, seen, SearchResultResponse.fromBusiness(b)));
            }
        }
    }

    private static void addIfNew(List<SearchResultResponse> combined, Set<String> seen, SearchResultResponse result) {
        if (seen.add(result.contentType() + ":" + result.id())) {
            combined.add(result);
        }
    }
}
