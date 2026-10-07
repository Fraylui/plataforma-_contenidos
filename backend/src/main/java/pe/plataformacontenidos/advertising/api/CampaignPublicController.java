package pe.plataformacontenidos.advertising.api;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.advertising.AdSection;
import pe.plataformacontenidos.advertising.CampaignService;
import pe.plataformacontenidos.advertising.api.dto.PlacementRotationResponse;

/**
 * Público (SecurityConfig). Tres pasos, como un ad server:
 * <ol>
 * <li>{@code GET /rotation}: qué campañas puede ver este visitante en una
 * posición, ya ordenadas — no cuenta nada.</li>
 * <li>{@code POST /{id}/impression}: el navegador avisa que el anuncio se
 * vio de verdad (50 % en pantalla durante 1 s).</li>
 * <li>{@code GET /{id}/click}: cuenta el clic y redirige (302) — el href del
 * HTML siempre es el nuestro, el link real nunca se expone.</li>
 * </ol>
 * La IP llega real detrás de nginx y del proxy de Next
 * (server.forward-headers-strategy).
 */
@RestController
@RequestMapping("/api/v1/ads/campaigns")
public class CampaignPublicController {

    private final CampaignService campaignService;

    public CampaignPublicController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    /**
     * Contexto de la página (`section`, `categoryId`) por parámetro; ubicación
     * del visitante por las cabeceras que agrega Cloudflare ("Add visitor
     * location headers") y que el proxy de Next reenvía. Sin Cloudflare (en
     * local) no llegan: solo califican campañas sin segmentación geográfica.
     */
    @GetMapping("/rotation")
    public ResponseEntity<PlacementRotationResponse> rotation(@RequestParam String placementKey,
            @RequestParam(required = false) AdSection section, @RequestParam(required = false) UUID categoryId,
            @RequestHeader(value = "CF-IPCountry", required = false) String country,
            @RequestHeader(value = "CF-Region", required = false) String region,
            @RequestHeader(value = "CF-Region-Code", required = false) String regionCode,
            HttpServletRequest request) {
        return campaignService.rotation(placementKey, request.getRemoteAddr(), section, categoryId, country, region,
                        regionCode)
                .map(rotation -> ResponseEntity.ok().cacheControl(CacheControl.noStore())
                        .body(PlacementRotationResponse.from(rotation)))
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    @PostMapping("/{id}/impression")
    public ResponseEntity<Void> impression(@PathVariable UUID id, HttpServletRequest request) {
        campaignService.recordImpression(id, request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/click")
    public ResponseEntity<Void> click(@PathVariable UUID id, HttpServletRequest request) {
        String linkUrl = campaignService.recordClickAndGetLinkUrl(id, request.getRemoteAddr(),
                request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.status(HttpStatus.FOUND).cacheControl(CacheControl.noStore())
                .location(URI.create(linkUrl)).build();
    }
}
