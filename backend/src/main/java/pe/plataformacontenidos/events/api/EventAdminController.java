package pe.plataformacontenidos.events.api;

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
import pe.plataformacontenidos.events.api.dto.RejectEventRequest;
import pe.plataformacontenidos.events.api.dto.ScheduleEventRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD editorial + transiciones de workflow para Eventos — mismo patrón que
 * PlaceAdminController. La autorización fina vive en EventService.
 */
@RestController
@RequestMapping("/api/v1/admin/events")
public class EventAdminController {

    private final EventService eventService;

    public EventAdminController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return eventService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(EventResponse::from).toList();
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.getForAdmin(id, principal.userId(), principal.role()));
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
                eventService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public EventResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public EventResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public EventResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectEventRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(
                eventService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public EventResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public EventResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleEventRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(
                eventService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public EventResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.archive(id, principal.userId(), principal.role()));
    }
}
