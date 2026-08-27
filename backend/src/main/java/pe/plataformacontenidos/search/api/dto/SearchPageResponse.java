package pe.plataformacontenidos.search.api.dto;

import java.util.List;

/**
 * Mismo shape que PageResponse en los demás módulos (content/places/audit),
 * pero no es un Spring Data Page: los resultados vienen de fusionar dos
 * queries distintas (Article + Place) en memoria — ver SearchService.
 */
public record SearchPageResponse(
        List<SearchResultResponse> items, int page, int size, long totalElements, int totalPages) {
}
