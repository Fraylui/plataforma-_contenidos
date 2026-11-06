package pe.plataformacontenidos.catalog;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Busca un contenido publicado de cualquier tipo por su id, con la fila de
 * lectura de su ficha: lo usa quien enlaza contenido de otros módulos (una
 * historia que lleva a una publicación) sin depender de esos módulos.
 */
@Component
public class ContentLookup {

    private final JdbcTemplate jdbc;
    private final ContentRegistry contents;

    public ContentLookup(JdbcTemplate jdbc, ContentRegistry contents) {
        this.jdbc = jdbc;
        this.contents = contents;
    }

    public record ContentRef(ContentType type, UUID id, String slug, String title) {
    }

    /** Vacío si no existe o no está publicado. */
    public Optional<ContentRef> find(ContentType type, UUID id) {
        if (type == null || id == null) {
            return Optional.empty();
        }
        String readSelect = contents.byType(type).readSelect();
        List<ContentRef> rows = jdbc.query(
                "SELECT r.slug, r.title FROM (" + readSelect + ") r WHERE r.id = ? AND r.status = 'PUBLISHED'",
                (rs, n) -> new ContentRef(type, id, rs.getString("slug"), rs.getString("title")), id);
        return rows.stream().findFirst();
    }
}
