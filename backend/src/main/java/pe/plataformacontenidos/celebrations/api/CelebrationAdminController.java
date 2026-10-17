package pe.plataformacontenidos.celebrations.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.celebrations.Celebration;
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
import pe.plataformacontenidos.celebrations.CelebrationService;
import pe.plataformacontenidos.celebrations.api.dto.CelebrationRequest;
import pe.plataformacontenidos.celebrations.api.dto.CelebrationResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para Eventos — mismo patrón que
 * PlaceAdminController. La autorización fina vive en CelebrationService.
 */
@RestController
@RequiresModule(value = Module.CELEBRATIONS)
@RequestMapping("/api/v1/admin/celebrations")
public class CelebrationAdminController {

    private final ContentEngagementService engagementService;

    private final CelebrationService celebrationService;

    public CelebrationAdminController(CelebrationService celebrationService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.celebrationService = celebrationService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<CelebrationResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(celebrationService.listForAdmin(query),
                CelebrationResponse::from, Celebration::getId, ContentType.CELEBRATION, engagementService);
    }

    @GetMapping("/{id}")
    public CelebrationResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(celebrationService.getForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CelebrationResponse create(@Valid @RequestBody CelebrationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(celebrationService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public CelebrationResponse update(@PathVariable UUID id, @Valid @RequestBody CelebrationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(
                celebrationService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public CelebrationResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(celebrationService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public CelebrationResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(celebrationService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public CelebrationResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(
                celebrationService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public CelebrationResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return CelebrationResponse.from(celebrationService.archive(id, principal.userId()));
    }

}
