package pe.plataformacontenidos.advertising.api;

import java.net.URI;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.advertising.CampaignService;
import pe.plataformacontenidos.advertising.api.dto.ActiveCampaignResponse;

/**
 * Público (SecurityConfig): esto es lo que AdBlock consulta antes de caer a
 * AdSense (ver ad-block.tsx). El endpoint de clic nunca devuelve el link
 * real en el body — redirige (302), así el href que ve el navegador siempre
 * es el nuestro y el clic queda contado.
 */
@RestController
@RequestMapping("/api/v1/ads/campaigns")
public class CampaignPublicController {

    private final CampaignService campaignService;

    public CampaignPublicController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping("/active")
    public ResponseEntity<ActiveCampaignResponse> active(@RequestParam String placementKey) {
        return campaignService.resolveActive(placementKey)
                .map(campaign -> ResponseEntity.ok(ActiveCampaignResponse.from(campaign)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/click")
    public ResponseEntity<Void> click(@PathVariable UUID id) {
        String linkUrl = campaignService.recordClickAndGetLinkUrl(id);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(linkUrl)).build();
    }
}
