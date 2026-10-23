package pe.plataformacontenidos.celebrations;

import java.util.UUID;

public class CelebrationNotFoundException extends RuntimeException {
    public CelebrationNotFoundException(UUID id) {
        super("Celebración no encontrada: " + id);
    }

    public CelebrationNotFoundException(String slug) {
        super("Celebración no encontrada: " + slug);
    }
}
