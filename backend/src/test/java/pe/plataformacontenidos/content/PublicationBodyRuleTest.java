package pe.plataformacontenidos.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

/** Una publicación puede ser solo fotos o un video (como un post), pero no estar vacía. */
class PublicationBodyRuleTest {

    @Test
    void textIsOptionalWithPhotosOrVideo() {
        assertThat(PublicationService.bodyOrEmpty(null, List.of("foto"), List.of())).isEmpty();
        assertThat(PublicationService.bodyOrEmpty("<p> </p>", List.of(), List.of("video"))).isEmpty();
        assertThat(PublicationService.bodyOrEmpty("<p>Hola</p>", List.of(), List.of())).isEqualTo("<p>Hola</p>");
    }

    @Test
    void somethingToShowIsRequired() {
        assertThatThrownBy(() -> PublicationService.bodyOrEmpty("", List.of(), List.of()))
                .isInstanceOf(EmptyPublicationException.class)
                .hasMessage("Agrega fotos, un video o un texto.");
        assertThatThrownBy(() -> PublicationService.bodyOrEmpty("<p>&nbsp;</p>", List.of(), List.of()))
                .isInstanceOf(EmptyPublicationException.class);
    }
}
