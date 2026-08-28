package pe.plataformacontenidos.directory;

import java.util.UUID;

/** El placeId vinculado no existe (validado vía PlaceService.existsById, sección 38). */
public class BusinessPlaceNotFoundException extends RuntimeException {
    public BusinessPlaceNotFoundException(UUID placeId) {
        super("Lugar no encontrado: " + placeId);
    }
}
