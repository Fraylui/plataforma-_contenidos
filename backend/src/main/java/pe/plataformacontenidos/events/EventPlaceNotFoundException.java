package pe.plataformacontenidos.events;

import java.util.UUID;

/** El placeId referenciado por el evento no existe (validado vía PlaceService.existsById, sección 38). */
public class EventPlaceNotFoundException extends RuntimeException {
    public EventPlaceNotFoundException(UUID placeId) {
        super("Lugar no encontrado: " + placeId);
    }
}
