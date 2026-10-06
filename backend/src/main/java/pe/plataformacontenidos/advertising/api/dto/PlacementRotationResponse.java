package pe.plataformacontenidos.advertising.api.dto;

import java.util.List;
import pe.plataformacontenidos.advertising.CampaignService.PlacementRotation;

/** Medida de la posición + campañas en el orden en que el navegador las asigna a cada espacio de la página. */
public record PlacementRotationResponse(int width, int height, List<ActiveCampaignResponse> campaigns) {

    public static PlacementRotationResponse from(PlacementRotation rotation) {
        return new PlacementRotationResponse(rotation.width(), rotation.height(),
                rotation.campaigns().stream().map(ActiveCampaignResponse::from).toList());
    }
}
