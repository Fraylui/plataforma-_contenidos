package pe.plataformacontenidos.events.api;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.events.api.dto.EventResponse;
import pe.plataformacontenidos.events.api.dto.EventSummaryResponse;
import pe.plataformacontenidos.shared.PageResponse;

/**
 * Solo contenido PUBLISHED — nada de estados intermedios visibles
 * públicamente. `when` separa próximos de pasados (razón de ser de este
 * módulo, ver EventService.listPublished) — no se ordena por published_at
 * como Publication/Place.
 */
@RestController
@RequestMapping("/api/v1/events")
public class EventPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final EventService eventService;
    private final ContentLikeService contentLikeService;

    public EventPublicController(EventService eventService, ContentLikeService contentLikeService) {
        this.eventService = eventService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<EventSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "upcoming") String when,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Clamp defensivo: page<0/size<1 lanzan IllegalArgumentException, y un page
        // extremo hace que offset (page*size) desborde Integer.MAX_VALUE en el
        // driver JDBC (InvalidDataAccessApiUsageException) — ambos son 500 en un
        // endpoint público sin autenticar. Ver ApiHardeningIntegrationTest.
        int safePage = Math.min(Math.max(page, 0), 10_000_000);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        boolean upcoming = !"past".equalsIgnoreCase(when);
        var pageable = PageRequest.of(safePage, safeSize);
        var result = eventService.listPublished(categoryId, upcoming, pageable);
        var likes = contentLikeService.countLikes(ContentType.EVENT,
                result.getContent().stream().map(Event::getId).toList());
        return PageResponse.from(result, item -> EventSummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    /**
     * «Hoy se celebra» del inicio: las fechas que tocan hoy (zona del sitio)
     * donde está el visitante. La ubicación llega por las cabeceras de
     * Cloudflare que reenvía el proxy de Next (como CampaignPublicController),
     * así que la respuesta es por visitante: el navegador la pide aparte y
     * la página sigue en caché.
     */
    @GetMapping("/today")
    public ResponseEntity<List<EventSummaryResponse>> today(
            @RequestHeader(value = "CF-IPCountry", required = false) String country,
            @RequestHeader(value = "CF-Region", required = false) String region,
            @RequestHeader(value = "CF-Region-Code", required = false) String regionCode) {
        var events = eventService.listToday(country, region, regionCode);
        var likes = contentLikeService.countLikes(ContentType.EVENT, events.stream().map(Event::getId).toList());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(events.stream().map(e -> EventSummaryResponse.from(e, likes.getOrDefault(e.getId(), 0L))).toList());
    }

    @GetMapping("/{slug}")
    public EventResponse getBySlug(@PathVariable String slug) {
        Event event = eventService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.EVENT, event.getId());
        return EventResponse.from(event, likeCount);
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Event event = eventService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.EVENT, event.getId(), visitorId));
    }
}
