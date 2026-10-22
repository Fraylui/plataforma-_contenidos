package pe.plataformacontenidos.media;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;

/**
 * Cuántas veces se usa una imagen en el sitio: por id (fotos de cada tipo,
 * portada de serie, creatividad de campaña, logo de anunciante) o por su URL
 * {@code /api/v1/images/{id}/file} (imágenes dentro del texto, imagen al
 * compartir, logo/favicon del sitio). Dónde mirar en el contenido lo dice la
 * ficha de cada módulo (ContentSource): media no conoce a esos módulos.
 * Solo se consulta al borrar, que es raro.
 */
@Component
public class ImageUsages {

    /** Usos fuera del contenido: creatividades, logos de anunciantes y la configuración del sitio. */
    private static final List<String> NON_CONTENT_USAGES = List.of(
            "(SELECT count(*) FROM advertising.campaigns x, p WHERE x.image_id = p.id)",
            "(SELECT count(*) FROM advertising.advertisers x, p WHERE x.logo_image_id = p.id)",
            "(SELECT count(*) FROM configuration.platform_settings x, p"
                    + " WHERE x.logo_url LIKE p.pat OR x.logo_dark_url LIKE p.pat"
                    + " OR x.favicon_url LIKE p.pat OR x.og_image_url LIKE p.pat)");

    private final JdbcTemplate jdbc;
    private final String sql;

    public ImageUsages(JdbcTemplate jdbc, ContentRegistry contents) {
        this.jdbc = jdbc;
        List<String> usages = new ArrayList<>();
        for (ContentSource source : contents.all()) {
            if (source.imagesTable() != null) {
                usages.add("(SELECT count(*) FROM " + source.imagesTable() + " x, p WHERE x.image_id = p.id)");
            }
            for (String column : source.imageIdColumns()) {
                usages.add("(SELECT count(*) FROM " + source.table() + " x, p WHERE x." + column + " = p.id)");
            }
            if (!source.imageUrlColumns().isEmpty()) {
                usages.add("(SELECT count(*) FROM " + source.table() + " x, p WHERE " + source.imageUrlColumns().stream()
                        .map(column -> "x." + column + " LIKE p.pat").collect(Collectors.joining(" OR ")) + ")");
            }
        }
        usages.addAll(NON_CONTENT_USAGES);
        this.sql = "WITH p AS (SELECT CAST(? AS uuid) AS id, '%/api/v1/images/' || ? || '/file%' AS pat)"
                + " SELECT " + String.join(" + ", usages);
    }

    public long count(UUID imageId) {
        Long total = jdbc.queryForObject(sql, Long.class, imageId.toString(), imageId.toString());
        return total == null ? 0 : total;
    }
}
