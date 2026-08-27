package pe.plataformacontenidos.reviews;

import java.util.UUID;

/** El placeId reseñado no existe (validado vía PlaceService.existsById, sección 38). */
public class ReviewPlaceNotFoundException extends RuntimeException {
    public ReviewPlaceNotFoundException(UUID placeId) {
        super("Lugar no encontrado: " + placeId);
    }
}
