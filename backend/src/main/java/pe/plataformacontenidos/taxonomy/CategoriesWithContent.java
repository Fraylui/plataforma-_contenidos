package pe.plataformacontenidos.taxonomy;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;

/**
 * Temas con al menos un contenido publicado en cualquier tipo (decisión del
 * dueño 2026-10-21: el visitante no ve temas vacíos). SQL directo sobre las
 * tablas que las fichas de contenido marcan como categorized: taxonomy no
 * conoce a los módulos de contenido (mismo criterio que media.ImageUsages).
 */
@Component
public class CategoriesWithContent {

    private final JdbcTemplate jdbc;
    private final String sql;

    public CategoriesWithContent(JdbcTemplate jdbc, ContentRegistry contents) {
        this.jdbc = jdbc;
        String published = contents.where(ContentSource::categorized).stream()
                .map(source -> "SELECT category_id FROM " + source.table() + " WHERE status = 'PUBLISHED'")
                .collect(Collectors.joining(" UNION ALL "));
        this.sql = "SELECT category_id, count(*) AS published FROM (" + published + ") published GROUP BY category_id";
    }

    public Set<UUID> ids() {
        return counts().keySet();
    }

    /** Contenido publicado propio de cada tema (sin sumar subtemas); los vacíos no aparecen. */
    public Map<UUID, Long> counts() {
        Map<UUID, Long> counts = new HashMap<>();
        jdbc.query(sql, row -> {
            counts.put(row.getObject("category_id", UUID.class), row.getLong("published"));
        });
        return counts;
    }
}
