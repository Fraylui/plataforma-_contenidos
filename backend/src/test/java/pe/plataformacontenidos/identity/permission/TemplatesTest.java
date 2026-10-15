package pe.plataformacontenidos.identity.permission;

import static org.assertj.core.api.Assertions.assertThat;
import static pe.plataformacontenidos.identity.permission.AccessLevel.ACCESS;
import static pe.plataformacontenidos.identity.permission.AccessLevel.PUBLISH;
import static pe.plataformacontenidos.identity.permission.Module.*;

import java.util.Map;
import org.junit.jupiter.api.Test;

/** Plantillas del panel (lenguaje de plataforma). Sin "Creador": todos publican directo desde V54. */
class TemplatesTest {

    @Test
    void templatesMatchTheSpec() {
        assertThat(Templates.of("PUBLICADOR")).isEqualTo(Map.of(
                ARTICLES, PUBLISH, PLACES, PUBLISH, EVENTS, PUBLISH, GALLERIES, PUBLISH, DIRECTORY, PUBLISH,
                SERIES, PUBLISH, CATEGORIES, ACCESS, STATS, ACCESS));
        assertThat(Templates.of("GESTOR_EVENTOS")).isEqualTo(Map.of(EVENTS, PUBLISH, PLACES, PUBLISH));
        assertThat(Templates.of("GESTOR_DIRECTORIO")).isEqualTo(Map.of(DIRECTORY, PUBLISH, PLACES, PUBLISH));
        assertThat(Templates.of("PUBLICIDAD")).isEqualTo(Map.of(ADVERTISING, ACCESS, STATS, ACCESS));
        // Administrador: todos los módulos; la auditoría no es un módulo (solo del dueño).
        assertThat(Templates.of("ADMINISTRADOR")).hasSize(Module.values().length)
                .containsEntry(WORKERS, ACCESS).containsEntry(SETTINGS, ACCESS).containsEntry(ARTICLES, PUBLISH);
    }

    @Test
    void creatorTemplateNoLongerExists() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> Templates.of("CREADOR"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void contentModulesAreTheFiveContentTypes() {
        assertThat(Module.values()).filteredOn(Module::isContent)
                .containsExactly(ARTICLES, PLACES, EVENTS, GALLERIES, DIRECTORY, SERIES);
    }
}
