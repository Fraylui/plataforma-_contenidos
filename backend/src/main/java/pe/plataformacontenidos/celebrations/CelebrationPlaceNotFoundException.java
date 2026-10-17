package pe.plataformacontenidos.celebrations;

import java.util.UUID;

/** El placeId referenciado por el evento no existe (validado vía PlaceService.existsById, sección 38). */
public class CelebrationPlaceNotFoundException extends RuntimeException {
    public CelebrationPlaceNotFoundException(UUID placeId) {
        super("Lugar no encontrado: " + placeId);
    }
}
