package pe.plataformacontenidos.events.api;

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
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.events.api.dto.EventRequest;
import pe.plataformacontenidos.events.api.dto.EventResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.shared.publishing.api.ReturnToDraftRequest;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para Eventos — mismo patrón que
 * PlaceAdminController. La autorización fina vive en EventService.
 */
@RestController
@RequiresModule(value = Module.EVENTS)
@RequestMapping("/api/v1/admin/events")
public class EventAdminController {

    private final EventService eventService;
    private final PermissionService permissionService;

    public EventAdminController(EventService eventService, PermissionService permissionService) {
        this.permissionService = permissionService;
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return eventService.listForAdmin(principal.userId(), canPublish(principal)).stream()
                .map(EventResponse::from).toList();
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.getForAdmin(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable UUID id, @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(
                eventService.update(id, request.toInput(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/submit")
    public EventResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public EventResponse returnToDraft(@PathVariable UUID id,
            @Valid @RequestBody(required = false) ReturnToDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String note = request == null ? null : request.note();
        return EventResponse.from(eventService.returnToDraft(id, note, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/publish")
    public EventResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.publish(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/schedule")
    public EventResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(
                eventService.schedule(id, request.scheduledAt(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/archive")
    public EventResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.archive(id, principal.userId(), canPublish(principal)));
    }

    private boolean canPublish(UserPrincipal principal) {
        var permissions = permissionService.forUser(principal.userId());
        return permissions.canPublish(Module.EVENTS);
    }
}
