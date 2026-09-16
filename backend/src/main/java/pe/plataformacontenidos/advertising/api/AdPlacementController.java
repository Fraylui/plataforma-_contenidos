package pe.plataformacontenidos.advertising.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.advertising.AdPlacementService;
import pe.plataformacontenidos.advertising.api.dto.AdPlacementResponse;
import pe.plataformacontenidos.advertising.api.dto.CreateAdPlacementRequest;
import pe.plataformacontenidos.advertising.api.dto.UpdateAdPlacementRequest;

/**
 * Lectura pública (el frontend resuelve `<AdBlock position="key" />` contra
 * esto en cada página, ver ad-block.tsx), escritura restringida a
 * SUPER_ADMIN/ADMIN (SecurityConfig) — es configuración de monetización, no
 * taxonomía de contenido, mismo nivel que PlatformSettingsAdminController.
 */
@RestController
@RequestMapping("/api/v1")
public class AdPlacementController {

    private final AdPlacementService adPlacementService;

    public AdPlacementController(AdPlacementService adPlacementService) {
        this.adPlacementService = adPlacementService;
    }

    @GetMapping("/ad-placements")
    public List<AdPlacementResponse> listEnabled() {
        return adPlacementService.listEnabled().stream().map(AdPlacementResponse::from).toList();
    }

    @GetMapping("/admin/ad-placements")
    public List<AdPlacementResponse> listAll() {
        return adPlacementService.listAll().stream().map(AdPlacementResponse::from).toList();
    }

    @GetMapping("/admin/ad-placements/{id}")
    public AdPlacementResponse getById(@PathVariable UUID id) {
        return AdPlacementResponse.from(adPlacementService.getOrThrow(id));
    }

    @PostMapping("/admin/ad-placements")
    @ResponseStatus(HttpStatus.CREATED)
    public AdPlacementResponse create(@Valid @RequestBody CreateAdPlacementRequest request) {
        var placement = adPlacementService.create(request.key(), request.label(), request.adsenseSlotId());
        return AdPlacementResponse.from(placement);
    }

    @PutMapping("/admin/ad-placements/{id}")
    public AdPlacementResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAdPlacementRequest request) {
        var placement = adPlacementService.update(id, request.label(), request.adsenseSlotId());
        return AdPlacementResponse.from(placement);
    }

    @PostMapping("/admin/ad-placements/{id}/activate")
    public void activate(@PathVariable UUID id) {
        adPlacementService.setEnabled(id, true);
    }

    @PostMapping("/admin/ad-placements/{id}/deactivate")
    public void deactivate(@PathVariable UUID id) {
        adPlacementService.setEnabled(id, false);
    }

    @DeleteMapping("/admin/ad-placements/{id}")
    public void delete(@PathVariable UUID id) {
        adPlacementService.delete(id);
    }
}
