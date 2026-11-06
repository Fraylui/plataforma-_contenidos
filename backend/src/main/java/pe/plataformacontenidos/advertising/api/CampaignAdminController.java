package pe.plataformacontenidos.advertising.api;

import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.advertising.CampaignService;
import pe.plataformacontenidos.advertising.CampaignTrackingService;
import pe.plataformacontenidos.advertising.api.dto.CampaignDailyStatResponse;
import pe.plataformacontenidos.advertising.api.dto.CampaignRequest;
import pe.plataformacontenidos.advertising.api.dto.CampaignResponse;

/** Solo admin (SecurityConfig): CRUD de campañas, incluye impresiones/clics para mostrarle métricas al anunciante. */
@RestController
@RequiresModule(value = Module.ADVERTISING, level = AccessLevel.ACCESS)
@RequestMapping("/api/v1/admin/campaigns")
public class CampaignAdminController {

    private final CampaignService campaignService;
    private final CampaignTrackingService tracking;

    public CampaignAdminController(CampaignService campaignService, CampaignTrackingService tracking) {
        this.campaignService = campaignService;
        this.tracking = tracking;
    }

    @GetMapping
    public List<CampaignResponse> listAll(@RequestParam(required = false) UUID advertiserId) {
        var campaigns = advertiserId != null ? campaignService.listByAdvertiser(advertiserId)
                : campaignService.listAll();
        return campaigns.stream().map(CampaignResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CampaignResponse getById(@PathVariable UUID id) {
        return CampaignResponse.from(campaignService.getOrThrow(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignResponse create(@Valid @RequestBody CampaignRequest request) {
        var campaign = campaignService.create(request.advertiserId(), request.toDraft());
        return CampaignResponse.from(campaign);
    }

    @PutMapping("/{id}")
    public CampaignResponse update(@PathVariable UUID id, @Valid @RequestBody CampaignRequest request) {
        var campaign = campaignService.update(id, request.toDraft());
        return CampaignResponse.from(campaign);
    }

    /** Impresiones visibles y clics válidos por día (UTC), de los últimos `days` días — reporte al anunciante. */
    @GetMapping("/{id}/stats")
    public List<CampaignDailyStatResponse> stats(@PathVariable UUID id,
            @RequestParam(defaultValue = "30") @Min(1) @Max(365) int days) {
        return tracking.dailyStats(id, days).stream().map(CampaignDailyStatResponse::from).toList();
    }

    @PostMapping("/{id}/activate")
    public void activate(@PathVariable UUID id) {
        campaignService.setActive(id, true);
    }

    @PostMapping("/{id}/deactivate")
    public void deactivate(@PathVariable UUID id) {
        campaignService.setActive(id, false);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        campaignService.delete(id);
    }
}
