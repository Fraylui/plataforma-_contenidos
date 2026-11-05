package pe.plataformacontenidos.shared.publishing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

/** Un post (publicación, lugar, celebración) puede ser solo fotos o un video, pero no estar vacío. */
class PostBodyTest {

    @Test
    void textIsOptionalWithPhotosOrVideo() {
        assertThat(PostBody.orEmpty(null, List.of("foto"), List.of())).isEmpty();
        assertThat(PostBody.orEmpty("<p> </p>", List.of(), List.of("video"))).isEmpty();
        assertThat(PostBody.orEmpty("<p>Hola</p>", List.of(), List.of())).isEqualTo("<p>Hola</p>");
    }

    @Test
    void somethingToShowIsRequired() {
        assertThatThrownBy(() -> PostBody.orEmpty("", List.of(), List.of()))
                .isInstanceOf(EmptyPostException.class)
                .hasMessage("Agrega fotos, un video o un texto.");
        assertThatThrownBy(() -> PostBody.orEmpty("<p>&nbsp;</p>", List.of(), List.of()))
                .isInstanceOf(EmptyPostException.class);
    }
}
