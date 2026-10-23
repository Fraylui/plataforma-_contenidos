package pe.plataformacontenidos.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

class ImageUsagesTest {

    @Test
    void looksForTheImageWhereverEachContentSourceSaysItCanBe() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        ContentRegistry contents = new ContentRegistry(List.of(
                ContentSource.of("places.places", Module.PLACES).type(ContentType.PLACE)
                        .imagesTable("places.place_images").imageUrlColumns("body", "og_image_url").build(),
                ContentSource.of("series.series", Module.SERIES).imageIdColumns("cover_image_id").build(),
                ContentSource.of("series.episodes", Module.SERIES).type(ContentType.EPISODE).build()));

        new ImageUsages(jdbc, contents).count(UUID.randomUUID());

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(sql.capture(), eq(Long.class), any(), any());
        assertThat(sql.getValue())
                .contains("FROM places.place_images x, p WHERE x.image_id = p.id")
                .contains("FROM series.series x, p WHERE x.cover_image_id = p.id")
                .contains("FROM places.places x, p WHERE x.body LIKE p.pat OR x.og_image_url LIKE p.pat")
                .doesNotContain("series.episodes")
                // Lo que no es contenido sigue contando: creatividades, logos y la configuración del sitio.
                .contains("advertising.campaigns").contains("advertising.advertisers")
                .contains("configuration.platform_settings");
    }
}
