package pe.plataformacontenidos.advertising;

import java.util.UUID;

public class AdvertiserNotFoundException extends RuntimeException {
    public AdvertiserNotFoundException(UUID id) {
        super("Anunciante no encontrado: " + id);
    }
}
