package pe.plataformacontenidos.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;

/** Cada módulo de contenido declara su ficha: si falta una, el feed, el panel o los temas la ignorarían en silencio. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ContentRegistryIntegrationTest {

    @Autowired
    private ContentRegistry registry;

    @Test
    void everyContentTypeAndEveryContentTableIsRegistered() {
        for (ContentType type : ContentType.values()) {
            assertThat(registry.byType(type)).as("ficha de %s", type).isNotNull();
        }
        assertThat(registry.all()).extracting(ContentSource::table).containsExactlyInAnyOrder(
                "content.publications", "places.places", "celebrations.celebrations", "galleries.galleries",
                "series.series", "series.episodes");
    }
}
