package pe.plataformacontenidos.media;

import java.util.UUID;

public class ImageNotFoundException extends RuntimeException {
    public ImageNotFoundException(UUID id) {
        super("Imagen no encontrada: " + id);
    }
}
