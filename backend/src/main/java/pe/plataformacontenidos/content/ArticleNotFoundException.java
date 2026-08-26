package pe.plataformacontenidos.content;

import java.util.UUID;

public class ArticleNotFoundException extends RuntimeException {
    public ArticleNotFoundException(UUID id) {
        super("Artículo no encontrado: " + id);
    }

    public ArticleNotFoundException(String slug) {
        super("Artículo no encontrado: " + slug);
    }
}
