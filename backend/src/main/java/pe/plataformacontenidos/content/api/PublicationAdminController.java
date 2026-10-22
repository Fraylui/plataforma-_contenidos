package pe.plataformacontenidos.content.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.catalog.ContentType;
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
import pe.plataformacontenidos.content.PublicationService;
import pe.plataformacontenidos.content.api.dto.PublicationRequest;
import pe.plataformacontenidos.content.api.dto.PublicationResponse;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD de contenido + transiciones del flujo. La autorización fina (máquina
 * de estados, qué transición es legal desde qué estado) vive en PublicationService,
 * no aquí — este controller solo traduce HTTP ↔ dominio.
 */
@RestController
@RequiresModule(value = Module.PUBLICATIONS)
@RequestMapping("/api/v1/admin/publications")
public class PublicationAdminController {

    private final ContentEngagementService engagementService;

    private final PublicationService publicationService;

    public PublicationAdminController(PublicationService publicationService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.publicationService = publicationService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<PublicationResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(publicationService.listForAdmin(query),
                PublicationResponse::from, Publication::getId, ContentType.PUBLICATION, engagementService);
    }

    @GetMapping("/{id}")
    public PublicationResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(publicationService.getForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublicationResponse create(@Valid @RequestBody PublicationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(publicationService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public PublicationResponse update(@PathVariable UUID id, @Valid @RequestBody PublicationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(
                publicationService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public PublicationResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(publicationService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public PublicationResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(publicationService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public PublicationResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(
                publicationService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public PublicationResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PublicationResponse.from(publicationService.archive(id, principal.userId()));
    }

}
