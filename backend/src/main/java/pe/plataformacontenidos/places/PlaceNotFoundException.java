package pe.plataformacontenidos.places;

import java.util.UUID;

public class PlaceNotFoundException extends RuntimeException {
    public PlaceNotFoundException(UUID id) {
        super("Lugar no encontrado: " + id);
    }

    public PlaceNotFoundException(String slug) {
        super("Lugar no encontrado: " + slug);
    }
}
