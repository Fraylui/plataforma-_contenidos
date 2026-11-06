package pe.plataformacontenidos.shared.publishing;

import java.util.List;
import pe.plataformacontenidos.shared.HtmlSanitizer;

/**
 * Regla de un post (publicación, lugar, celebración): con fotos o un video el
 * texto largo es opcional, como en una red social; sin nada que mostrar no se
 * guarda. Devuelve el texto saneado, o "" si no tiene texto visible.
 */
public final class PostBody {

    private PostBody() {
    }

    public static String orEmpty(String body, List<?> images, List<?> videos) {
        String sanitized = body == null || body.isBlank() ? "" : HtmlSanitizer.sanitize(body);
        boolean hasText = !sanitized.replaceAll("<[^>]*>", "").replaceAll("&nbsp;|&#160;| ", " ").isBlank();
        if (!hasText && images.isEmpty() && videos.isEmpty()) {
            throw new EmptyPostException();
        }
        return hasText ? sanitized : "";
    }
}
