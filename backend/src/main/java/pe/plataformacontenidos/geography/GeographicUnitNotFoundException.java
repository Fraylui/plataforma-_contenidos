package pe.plataformacontenidos.geography;

import java.util.UUID;

public class GeographicUnitNotFoundException extends RuntimeException {
    public GeographicUnitNotFoundException(UUID id) {
        super("Unidad geográfica no encontrada: " + id);
    }
}
