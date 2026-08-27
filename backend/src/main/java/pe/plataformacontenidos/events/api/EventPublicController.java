package pe.plataformacontenidos.events.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.events.api.dto.EventResponse;
import pe.plataformacontenidos.events.api.dto.EventSummaryResponse;
import pe.plataformacontenidos.events.api.dto.PageResponse;

/**
 * Solo contenido PUBLISHED — nada de estados intermedios visibles
 * públicamente. `when` separa próximos de pasados (razón de ser de este
 * módulo, ver EventService.listPublished) — no se ordena por published_at
 * como Article/Place.
 */
@RestController
@RequestMapping("/api/v1/events")
public class EventPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final EventService eventService;

    public EventPublicController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public PageResponse<EventSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "upcoming") String when,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        boolean upcoming = !"past".equalsIgnoreCase(when);
        var pageable = PageRequest.of(page, safeSize);
        var result = eventService.listPublished(categoryId, geographyId, upcoming, pageable);
        return PageResponse.from(result, EventSummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public EventResponse getBySlug(@PathVariable String slug) {
        Event event = eventService.getPublishedBySlug(slug);
        return EventResponse.from(event);
    }
}
