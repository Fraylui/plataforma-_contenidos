package pe.plataformacontenidos.taxonomy;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Temas con al menos un contenido publicado en cualquier tipo (decisión del
 * dueño 2026-10-21: el visitante no ve temas vacíos). SQL directo para no
 * acoplar taxonomy a los módulos de contenido (mismo criterio que
 * media.ImageUsages).
 */
@Component
public class CategoriesWithContent {

    private static final String SQL = """
            SELECT category_id FROM content.publications WHERE status = 'PUBLISHED'
            UNION SELECT category_id FROM places.places WHERE status = 'PUBLISHED'
            UNION SELECT category_id FROM celebrations.celebrations WHERE status = 'PUBLISHED'
            UNION SELECT category_id FROM galleries.galleries WHERE status = 'PUBLISHED'
            UNION SELECT category_id FROM series.series WHERE status = 'PUBLISHED'
            """;

    private final JdbcTemplate jdbc;

    public CategoriesWithContent(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Set<UUID> ids() {
        return new HashSet<>(jdbc.queryForList(SQL, UUID.class));
    }
}
