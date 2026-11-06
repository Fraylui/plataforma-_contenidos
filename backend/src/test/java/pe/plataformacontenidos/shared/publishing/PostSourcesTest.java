package pe.plataformacontenidos.shared.publishing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.shared.ContentImageInput;

/** Fuentes y crédito de fotos (GUIA-CREAR-CONTENIDO.md §3–4). */
class PostSourcesTest {

    @Test
    void sourcesAreCleanedAndStoredOnePerLine() {
        String column = PostSources.toColumn(Arrays.asList(" https://www.promperu.gob.pe/x ", "", null,
                "https://www.promperu.gob.pe/x", "http://inei.gob.pe"));
        assertThat(column).isEqualTo("https://www.promperu.gob.pe/x\nhttp://inei.gob.pe");
        assertThat(PostSources.fromColumn(column)).containsExactly("https://www.promperu.gob.pe/x", "http://inei.gob.pe");
        assertThat(PostSources.toColumn(List.of())).isNull();
        assertThat(PostSources.fromColumn(null)).isEmpty();
    }

    @Test
    void rejectsBadLinksAndTooMany() {
        assertThatThrownBy(() -> PostSources.toColumn(List.of("javascript:alert(1)"))).isInstanceOf(InvalidSourceException.class);
        assertThatThrownBy(() -> PostSources.toColumn(List.of("Promperú"))).isInstanceOf(InvalidSourceException.class);
        List<String> eleven = new java.util.ArrayList<>();
        for (int i = 0; i < 11; i++) {
            eleven.add("https://fuente" + i + ".pe");
        }
        assertThatThrownBy(() -> PostSources.toColumn(eleven)).isInstanceOf(InvalidSourceException.class);
        assertThat(Collections.nCopies(3, "https://a.pe")).hasSize(3);
    }

    @Test
    void someoneElsesPhotoNeedsConfirmedPermission() {
        java.util.UUID id = java.util.UUID.randomUUID();
        assertThat(new ContentImageInput(id, null, null, null, null, null).hasValidCredit()).as("foto propia").isTrue();
        assertThat(new ContentImageInput(id, null, null, null, "  ", null).hasValidCredit()).as("crédito vacío = propia").isTrue();
        assertThat(new ContentImageInput(id, null, null, null, "Ana Ríos", false).hasValidCredit()).isFalse();
        assertThat(new ContentImageInput(id, null, null, null, "Ana Ríos", true).hasValidCredit()).isTrue();
        assertThat(new ContentImageInput(id, null, null, null, "x".repeat(121), true).hasValidCredit()).isFalse();

        var image = new ContentImageInput(id, null, "Laguna", null, " Ana Ríos ", true).toContentImage();
        assertThat(image.getCredit()).isEqualTo("Ana Ríos");
        assertThat(image.isRightsConfirmed()).isTrue();
        assertThat(new ContentImageInput(id, null, null, null, null, true).toContentImage().getCredit()).isNull();
    }
}
