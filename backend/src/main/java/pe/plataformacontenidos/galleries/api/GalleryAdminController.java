package pe.plataformacontenidos.galleries.api;

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
import pe.plataformacontenidos.galleries.api.dto.RejectGalleryRequest;
import pe.plataformacontenidos.galleries.api.dto.ScheduleGalleryRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD editorial + transiciones de workflow para Galerías — mismo patrón que
 * EventAdminController. La autorización fina vive en GalleryService.
 */
@RestController
@RequestMapping("/api/v1/admin/galleries")
public class GalleryAdminController {

    private final GalleryService galleryService;

    public GalleryAdminController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    @GetMapping
    public List<GalleryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return galleryService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(GalleryResponse::from).toList();
    }

    @GetMapping("/{id}")
    public GalleryResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.getForAdmin(id, principal.userId(), principal.role()));
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
                galleryService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public GalleryResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public GalleryResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public GalleryResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectGalleryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(
                galleryService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public GalleryResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public GalleryResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleGalleryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(
                galleryService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public GalleryResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return GalleryResponse.from(galleryService.archive(id, principal.userId(), principal.role()));
    }
}
