package pe.plataformacontenidos.reviews;

import java.util.UUID;

public class ReviewNotFoundException extends RuntimeException {
    public ReviewNotFoundException(UUID id) {
        super("Reseña no encontrada: " + id);
    }

    public ReviewNotFoundException(String slug) {
        super("Reseña no encontrada: " + slug);
    }
}
