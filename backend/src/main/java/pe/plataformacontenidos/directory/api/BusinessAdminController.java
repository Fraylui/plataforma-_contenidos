package pe.plataformacontenidos.directory.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.directory.api.dto.BusinessRequest;
import pe.plataformacontenidos.directory.api.dto.BusinessResponse;
import pe.plataformacontenidos.directory.api.dto.RejectBusinessRequest;
import pe.plataformacontenidos.directory.api.dto.ScheduleBusinessRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD editorial + transiciones de workflow para el Directorio — mismo
 * patrón que ReviewAdminController. La autorización fina vive en
 * BusinessService.
 */
@RestController
@RequestMapping("/api/v1/admin/directory")
public class BusinessAdminController {

    private final BusinessService businessService;

    public BusinessAdminController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping
    public List<BusinessResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return businessService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(BusinessResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BusinessResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.getForAdmin(id, principal.userId(), principal.role()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessResponse create(@Valid @RequestBody BusinessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public BusinessResponse update(@PathVariable UUID id, @Valid @RequestBody BusinessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(
                businessService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public BusinessResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public BusinessResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public BusinessResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectBusinessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(
                businessService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public BusinessResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public BusinessResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleBusinessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(
                businessService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public BusinessResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.archive(id, principal.userId(), principal.role()));
    }
}
