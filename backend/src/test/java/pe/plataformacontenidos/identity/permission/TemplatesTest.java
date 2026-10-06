package pe.plataformacontenidos.identity.permission;

import static org.assertj.core.api.Assertions.assertThat;
import static pe.plataformacontenidos.identity.permission.AccessLevel.ACCESS;
import static pe.plataformacontenidos.identity.permission.AccessLevel.CREATE;
import static pe.plataformacontenidos.identity.permission.AccessLevel.PUBLISH;
import static pe.plataformacontenidos.identity.permission.Module.*;

import java.util.Map;
import org.junit.jupiter.api.Test;

/** Plantillas del spec §3.4 (lenguaje de plataforma: Creador, Publicador…). */
class TemplatesTest {

    @Test
    void templatesMatchTheSpec() {
        assertThat(Templates.of("CREADOR")).isEqualTo(Map.of(
                ARTICLES, CREATE, PLACES, CREATE, EVENTS, CREATE, GALLERIES, CREATE, DIRECTORY, CREATE));
        assertThat(Templates.of("PUBLICADOR")).isEqualTo(Map.of(
                ARTICLES, PUBLISH, PLACES, PUBLISH, EVENTS, PUBLISH, GALLERIES, PUBLISH, DIRECTORY, PUBLISH,
                CATEGORIES, ACCESS, STATS, ACCESS));
        assertThat(Templates.of("GESTOR_EVENTOS")).isEqualTo(Map.of(EVENTS, PUBLISH, PLACES, PUBLISH));
        assertThat(Templates.of("GESTOR_DIRECTORIO")).isEqualTo(Map.of(DIRECTORY, PUBLISH, PLACES, PUBLISH));
        assertThat(Templates.of("PUBLICIDAD")).isEqualTo(Map.of(ADVERTISING, ACCESS, STATS, ACCESS));
    }

    @Test
    void contentModulesAreTheFiveContentTypes() {
        assertThat(Module.values()).filteredOn(Module::isContent)
                .containsExactly(ARTICLES, PLACES, EVENTS, GALLERIES, DIRECTORY);
    }
}
