package pe.plataformacontenidos.media;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Cuántas veces se usa una imagen en el sitio: por id (fotos de cada tipo,
 * portada de serie, creatividad de campaña, logo de anunciante) o por su URL
 * {@code /api/v1/images/{id}/file} (imágenes dentro del texto, imagen al
 * compartir, logo/favicon del sitio). SQL directo para no acoplar media a
 * los módulos que la usan; solo se consulta al borrar, que es raro.
 */
@Component
public class ImageUsages {

    private static final String SQL = """
            WITH p AS (SELECT CAST(? AS uuid) AS id, '%/api/v1/images/' || ? || '/file%' AS pat)
            SELECT
                (SELECT count(*) FROM content.publication_images x, p WHERE x.image_id = p.id)
              + (SELECT count(*) FROM places.place_images x, p WHERE x.image_id = p.id)
              + (SELECT count(*) FROM celebrations.celebration_images x, p WHERE x.image_id = p.id)
              + (SELECT count(*) FROM galleries.gallery_images x, p WHERE x.image_id = p.id)
              + (SELECT count(*) FROM series.series x, p WHERE x.cover_image_id = p.id)
              + (SELECT count(*) FROM advertising.campaigns x, p WHERE x.image_id = p.id)
              + (SELECT count(*) FROM advertising.advertisers x, p WHERE x.logo_image_id = p.id)
              + (SELECT count(*) FROM content.publications x, p WHERE x.body LIKE p.pat OR x.og_image_url LIKE p.pat)
              + (SELECT count(*) FROM places.places x, p WHERE x.body LIKE p.pat OR x.og_image_url LIKE p.pat)
              + (SELECT count(*) FROM celebrations.celebrations x, p WHERE x.body LIKE p.pat OR x.og_image_url LIKE p.pat)
              + (SELECT count(*) FROM galleries.galleries x, p WHERE x.og_image_url LIKE p.pat)
              + (SELECT count(*) FROM configuration.platform_settings x, p
                 WHERE x.logo_url LIKE p.pat OR x.logo_dark_url LIKE p.pat
                    OR x.favicon_url LIKE p.pat OR x.og_image_url LIKE p.pat)
            """;

    private final JdbcTemplate jdbc;

    public ImageUsages(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long count(UUID imageId) {
        Long total = jdbc.queryForObject(SQL, Long.class, imageId.toString(), imageId.toString());
        return total == null ? 0 : total;
    }
}
