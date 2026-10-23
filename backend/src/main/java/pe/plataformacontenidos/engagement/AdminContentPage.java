package pe.plataformacontenidos.engagement;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import pe.plataformacontenidos.catalog.ContentType;

/**
 * Página de un listado de contenido del panel: lo mismo que PageResponse más
 * los me gusta y visitas de cada fila ({@code engagement}, por id).
 */
public record AdminContentPage<T>(List<T> items, int page, int size, long totalElements, int totalPages,
        Map<UUID, ContentEngagementService.Counts> engagement) {

    public static <S, T> AdminContentPage<T> from(Page<S> page, Function<S, T> mapper, Function<S, UUID> idOf,
            ContentType type, ContentEngagementService engagementService) {
        List<UUID> ids = page.getContent().stream().map(idOf).toList();
        return new AdminContentPage<>(page.getContent().stream().map(mapper).toList(), page.getNumber(),
                page.getSize(), page.getTotalElements(), page.getTotalPages(), engagementService.countsFor(type, ids));
    }
}
