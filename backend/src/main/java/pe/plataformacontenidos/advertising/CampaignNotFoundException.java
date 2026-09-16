package pe.plataformacontenidos.advertising;

import java.util.UUID;

public class CampaignNotFoundException extends RuntimeException {
    public CampaignNotFoundException(UUID id) {
        super("Campaña no encontrada: " + id);
    }
}
