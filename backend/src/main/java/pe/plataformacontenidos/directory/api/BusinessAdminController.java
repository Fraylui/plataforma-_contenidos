package pe.plataformacontenidos.directory.api;

import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
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
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.shared.publishing.api.ReturnToDraftRequest;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para el Directorio — mismo
 * patrón que GalleryAdminController. La autorización fina vive en
 * BusinessService.
 */
@RestController
@RequiresModule(value = Module.DIRECTORY)
@RequestMapping("/api/v1/admin/directory")
public class BusinessAdminController {

    private final BusinessService businessService;
    private final PermissionService permissionService;

    public BusinessAdminController(BusinessService businessService, PermissionService permissionService) {
        this.permissionService = permissionService;
        this.businessService = businessService;
    }

    @GetMapping
    public List<BusinessResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return businessService.listForAdmin(principal.userId(), canPublish(principal)).stream()
                .map(BusinessResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BusinessResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.getForAdmin(id, principal.userId(), canPublish(principal)));
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
                businessService.update(id, request.toInput(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/submit")
    public BusinessResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public BusinessResponse returnToDraft(@PathVariable UUID id,
            @Valid @RequestBody(required = false) ReturnToDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String note = request == null ? null : request.note();
        return BusinessResponse.from(businessService.returnToDraft(id, note, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/publish")
    public BusinessResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.publish(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/schedule")
    public BusinessResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(
                businessService.schedule(id, request.scheduledAt(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/archive")
    public BusinessResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.archive(id, principal.userId(), canPublish(principal)));
    }

    private boolean canPublish(UserPrincipal principal) {
        var permissions = permissionService.forUser(principal.userId());
        return permissions.canPublish(Module.DIRECTORY);
    }
}
