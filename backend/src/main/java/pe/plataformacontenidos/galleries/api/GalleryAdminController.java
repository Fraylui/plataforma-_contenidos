package pe.plataformacontenidos.galleries.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.galleries.Gallery;
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
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.galleries.api.dto.GalleryRequest;
import pe.plataformacontenidos.galleries.api.dto.GalleryResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para Galerías — mismo patrón que
 * EventAdminController. La autorización fina vive en GalleryService.
 */
@RestController
@RequiresModule(value = Module.GALLERIES)
@RequestMapping("/api/v1/admin/galleries")
public class GalleryAdminController {

    private final ContentEngagementService engagementService;

    private final GalleryService galleryService;

    public GalleryAdminController(GalleryService galleryService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.galleryService = galleryService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<GalleryResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(galleryService.listForAdmin(query),
                GalleryResponse::from, Gallery::getId, ContentType.GALLERY, engagementService);
    }

    @GetMapping("/{id}")
    public GalleryResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.getForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GalleryResponse create(@Valid @RequestBody GalleryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public GalleryResponse update(@PathVariable UUID id, @Valid @RequestBody GalleryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(
                galleryService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public GalleryResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public GalleryResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public GalleryResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(
                galleryService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public GalleryResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.archive(id, principal.userId()));
    }

}
