package pe.plataformacontenidos.advertising.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.advertising.AdPlacement;

/** Misma forma para lectura pública y de admin: el slot de AdSense no es secreto (se ve en el HTML renderizado). */
public record AdPlacementResponse(UUID id, String key, String label, String adsenseSlotId, boolean enabled) {

    public static AdPlacementResponse from(AdPlacement placement) {
        return new AdPlacementResponse(placement.getId(), placement.getKey(), placement.getLabel(),
                placement.getAdsenseSlotId(), placement.isEnabled());
    }
}
