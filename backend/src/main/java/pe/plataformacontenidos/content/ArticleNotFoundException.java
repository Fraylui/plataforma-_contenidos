package pe.plataformacontenidos.content;

import java.util.UUID;

public class ArticleNotFoundException extends RuntimeException {
    public ArticleNotFoundException(UUID id) {
        super("Publicación no encontrada: " + id);
    }

    public ArticleNotFoundException(String slug) {
        super("Publicación no encontrada: " + slug);
    }
}
