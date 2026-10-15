package pe.plataformacontenidos.events.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
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
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/**
 * CRUD de contenido + transiciones de workflow para Eventos — mismo patrón que
 * PlaceAdminController. La autorización fina vive en EventService.
 */
@RestController
@RequiresModule(value = Module.EVENTS)
@RequestMapping("/api/v1/admin/events")
public class EventAdminController {

    private final ContentEngagementService engagementService;

    private final EventService eventService;

    public EventAdminController(EventService eventService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.eventService = eventService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<EventResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(eventService.listForAdmin(query),
                EventResponse::from, Event::getId, ContentType.EVENT, engagementService);
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.getForAdmin(id));
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
                eventService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public EventResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public EventResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public EventResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(
                eventService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public EventResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return EventResponse.from(eventService.archive(id, principal.userId()));
    }

}
