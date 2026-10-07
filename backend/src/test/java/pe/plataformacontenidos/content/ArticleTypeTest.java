package pe.plataformacontenidos.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import org.junit.jupiter.api.Test;

/**
 * Formatos de publicación de una plataforma de contenido, no géneros
 * periodísticos (decisión del dueño, 2026-10-06: "esto no es periodismo,
 * no es editorial"). V48 migra los datos viejos.
 */
class ArticleTypeTest {

    @Test
    void onlyPlatformFormatsExist() {
        assertThat(Arrays.stream(ArticleType.values()).map(Enum::name))
                .containsExactly("GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA", "ENTREVISTA");
    }
}
