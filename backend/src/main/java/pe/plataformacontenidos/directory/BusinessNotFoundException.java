package pe.plataformacontenidos.directory;

import java.util.UUID;

public class BusinessNotFoundException extends RuntimeException {
    public BusinessNotFoundException(UUID id) {
        super("Ficha de directorio no encontrada: " + id);
    }

    public BusinessNotFoundException(String slug) {
        super("Ficha de directorio no encontrada: " + slug);
    }
}
