package pe.plataformacontenidos.directory.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
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
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
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

    private final ContentEngagementService engagementService;

    private final BusinessService businessService;

    public BusinessAdminController(BusinessService businessService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.businessService = businessService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<BusinessResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(businessService.listForAdmin(query),
                BusinessResponse::from, Business::getId, ContentType.BUSINESS, engagementService);
    }

    @GetMapping("/{id}")
    public BusinessResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.getForAdmin(id));
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
                businessService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public BusinessResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public BusinessResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public BusinessResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(
                businessService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public BusinessResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return BusinessResponse.from(businessService.archive(id, principal.userId()));
    }

}
