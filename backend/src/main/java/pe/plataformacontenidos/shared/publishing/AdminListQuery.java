package pe.plataformacontenidos.shared.publishing;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/**
 * Listado del panel para los 5 tipos de contenido, paginado en el servidor
 * (hoja de ruta F3): antes cada listado devolvía la tabla completa. Una sola
 * definición para los 5 — solo cambia el nombre del campo de título
 * ({@code title} o {@code name}).
 *
 * <ul>
 * <li>{@code q}: busca en el título, sin distinguir mayúsculas.</li>
 * <li>{@code status}: un estado, o todos si es null.</li>
 * <li>{@code sort}: campo permitido y dirección, ej. {@code createdAt,desc};
 * cualquier otro valor cae al orden por defecto (más reciente primero).</li>
 * <li>{@code size}: entre 1 y {@value #MAX_SIZE}.</li>
 * </ul>
 */
public record AdminListQuery(String q, PublicationStatus status, String sort, int page, int size) {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    /** Nombre público de la columna → campo de la entidad ("title" se traduce al campo de título del tipo). */
    private static final Map<String, String> SORTABLE = Map.of(
            "createdAt", "createdAt",
            "updatedAt", "updatedAt",
            "publishedAt", "publishedAt",
            "status", "status",
            "title", "title");

    public AdminListQuery {
        q = q == null || q.isBlank() ? null : q.strip();
        page = Math.max(page, 0);
        size = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
    }

    /** {@code extraSortable}: campos propios del tipo que también se pueden ordenar (ej. startsAt en Celebraciones). */
    public Pageable pageable(String titleField, String... extraSortable) {
        Sort order = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null) {
            String[] parts = sort.split(",", 2);
            String field = List.of(extraSortable).contains(parts[0]) ? parts[0] : SORTABLE.get(parts[0]);
            if (field != null) {
                boolean asc = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].strip());
                String entityField = "title".equals(field) ? titleField : field;
                order = Sort.by(asc ? Sort.Direction.ASC : Sort.Direction.DESC, entityField);
                if (!"createdAt".equals(entityField)) {
                    order = order.and(Sort.by(Sort.Direction.DESC, "createdAt"));
                }
            }
        }
        return PageRequest.of(page, size, order);
    }

    public <T extends PublishableContent> Specification<T> specification(String titleField) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (q != null) {
                String pattern = "%" + escapeLike(q.toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.like(cb.lower(root.get(titleField)), pattern, '\\'));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
