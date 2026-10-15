package pe.plataformacontenidos.places.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
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
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.places.api.dto.PlaceRequest;
import pe.plataformacontenidos.places.api.dto.PlaceResponse;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ReturnToDraftRequest;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para Lugares — mismo patrón que
 * ArticleAdminController. La autorización fina vive en PlaceService.
 */
@RestController
@RequiresModule(value = Module.PLACES)
@RequestMapping("/api/v1/admin/places")
public class PlaceAdminController {

    private final ContentEngagementService engagementService;

    private final PlaceService placeService;
    private final PermissionService permissionService;

    public PlaceAdminController(PlaceService placeService, PermissionService permissionService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.permissionService = permissionService;
        this.placeService = placeService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<PlaceResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(placeService.listForAdmin(principal.userId(), canPublish(principal), query),
                PlaceResponse::fromAdmin, Place::getId, ContentType.PLACE, engagementService);
    }

    @GetMapping("/{id}")
    public PlaceResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.getForAdmin(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceResponse create(@Valid @RequestBody PlaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public PlaceResponse update(@PathVariable UUID id, @Valid @RequestBody PlaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(
                placeService.update(id, request.toInput(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/submit")
    public PlaceResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public PlaceResponse returnToDraft(@PathVariable UUID id,
            @Valid @RequestBody(required = false) ReturnToDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String note = request == null ? null : request.note();
        return PlaceResponse.fromAdmin(placeService.returnToDraft(id, note, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/publish")
    public PlaceResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.publish(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/schedule")
    public PlaceResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(
                placeService.schedule(id, request.scheduledAt(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/archive")
    public PlaceResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.archive(id, principal.userId(), canPublish(principal)));
    }

    private boolean canPublish(UserPrincipal principal) {
        var permissions = permissionService.forUser(principal.userId());
        return permissions.canPublish(Module.PLACES);
    }
}
