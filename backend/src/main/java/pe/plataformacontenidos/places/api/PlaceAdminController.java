package pe.plataformacontenidos.places.api;

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
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.places.api.dto.PlaceRequest;
import pe.plataformacontenidos.places.api.dto.PlaceResponse;
import pe.plataformacontenidos.places.api.dto.RejectPlaceRequest;
import pe.plataformacontenidos.places.api.dto.SchedulePlaceRequest;

/**
 * CRUD editorial + transiciones de workflow para Lugares — mismo patrón que
 * ArticleAdminController. La autorización fina vive en PlaceService.
 */
@RestController
@RequestMapping("/api/v1/admin/places")
public class PlaceAdminController {

    private final PlaceService placeService;

    public PlaceAdminController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping
    public List<PlaceResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return placeService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(PlaceResponse::fromAdmin).toList();
    }

    @GetMapping("/{id}")
    public PlaceResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.getForAdmin(id, principal.userId(), principal.role()));
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
                placeService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public PlaceResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public PlaceResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public PlaceResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectPlaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(
                placeService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public PlaceResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public PlaceResponse schedule(@PathVariable UUID id, @Valid @RequestBody SchedulePlaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(
                placeService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public PlaceResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return PlaceResponse.fromAdmin(placeService.archive(id, principal.userId(), principal.role()));
    }
}
