package pe.plataformacontenidos.content;

import java.util.UUID;

public class PublicationNotFoundException extends RuntimeException {
    public PublicationNotFoundException(UUID id) {
        super("Publicación no encontrada: " + id);
    }

    public PublicationNotFoundException(String slug) {
        super("Publicación no encontrada: " + slug);
    }
}
