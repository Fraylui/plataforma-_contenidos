package pe.plataformacontenidos.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

class CategoriesWithContentTest {

    @Test
    void countsPublishedContentInEveryCategorizedTableAndNothingElse() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        ContentRegistry contents = new ContentRegistry(List.of(
                ContentSource.of("places.places", Module.PLACES).type(ContentType.PLACE).categorized().build(),
                ContentSource.of("series.series", Module.SERIES).categorized().build(),
                ContentSource.of("series.episodes", Module.SERIES).type(ContentType.EPISODE).build()));

        new CategoriesWithContent(jdbc, contents).counts();

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).query(sql.capture(), any(RowCallbackHandler.class));
        assertThat(sql.getValue())
                .contains("SELECT category_id FROM places.places WHERE status = 'PUBLISHED'")
                .contains("UNION ALL SELECT category_id FROM series.series WHERE status = 'PUBLISHED'")
                .doesNotContain("series.episodes");
    }
}
