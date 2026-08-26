package pe.plataformacontenidos.taxonomy;

import java.util.UUID;

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(UUID id) {
        super("Categoría no encontrada: " + id);
    }
}
