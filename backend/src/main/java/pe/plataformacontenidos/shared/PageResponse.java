package pe.plataformacontenidos.shared;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Página de un listado, igual para todos los módulos (antes había una copia por módulo). */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
