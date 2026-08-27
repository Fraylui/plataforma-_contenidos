package pe.plataformacontenidos.galleries;

import java.util.UUID;

public class GalleryNotFoundException extends RuntimeException {
    public GalleryNotFoundException(UUID id) {
        super("Galería no encontrada: " + id);
    }

    public GalleryNotFoundException(String slug) {
        super("Galería no encontrada: " + slug);
    }
}
