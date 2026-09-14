package pe.plataformacontenidos.advertising;

import java.util.UUID;

public class AdPlacementNotFoundException extends RuntimeException {
    public AdPlacementNotFoundException(UUID id) {
        super("Posición de anuncio no encontrada: " + id);
    }
}
