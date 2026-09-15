package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.content.YouTubeUrlParser;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo editorial de Eventos (CONTEXTO.md sección 12), mismo
 * patrón que ArticleService/PlaceService. La autorización a nivel de objeto
 * vive acá (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final CategoryService categoryService;
    private final PlaceService placeService;
    private final ImageService imageService;
    private final AuditService auditService;

    public EventService(EventRepository eventRepository, CategoryService categoryService,
            PlaceService placeService, ImageService imageService, AuditService auditService) {
        this.eventRepository = eventRepository;
        this.categoryService = categoryService;
        this.placeService = placeService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Event create(EventInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validatePlace(input.placeId());
        validateDateRange(input.startsAt(), input.endsAt());
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Event event = new Event(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), sanitizedBody,
                authorId, input.categoryId(), input.startsAt());
        event.updateContent(input.title(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.placeId(), input.venueName(), input.startsAt(), input.endsAt(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());

        Event saved = eventRepository.save(event);
        audit("EVENT_CREATED", saved, authorId);
        return saved;
    }

    public Event update(UUID eventId, EventInput input, UUID actingUserId, Role actingRole) {
        Event event = getOrThrow(eventId);
        requireCanEdit(event, actingUserId, actingRole);

        if (!event.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (!Objects.equals(event.getPlaceId(), input.placeId())) {
            validatePlace(input.placeId());
        }
        validateDateRange(input.startsAt(), input.endsAt());
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        event.updateContent(input.title(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.placeId(), input.venueName(), input.startsAt(), input.endsAt(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());
        Event saved = eventRepository.save(event);
        audit("EVENT_UPDATED", saved, actingUserId);
        return saved;
    }

    public Event submit(UUID eventId, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        if (!event.isOwnedBy(actingUserId)) {
            throw new EventAccessDeniedException();
        }
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.REJECTED) {
            throw new InvalidEventTransitionException(event.getStatus(), "enviar a revisión");
        }
        event.submitForReview();
        Event saved = eventRepository.save(event);
        audit("EVENT_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Event approve(UUID eventId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Event event = getOrThrow(eventId);
        if (event.getStatus() != EventStatus.IN_REVIEW) {
            throw new InvalidEventTransitionException(event.getStatus(), "aprobar");
        }
        event.approve();
        Event saved = eventRepository.save(event);
        audit("EVENT_APPROVED", saved, actingUserId);
        return saved;
    }

    public Event reject(UUID eventId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Event event = getOrThrow(eventId);
        if (event.getStatus() != EventStatus.IN_REVIEW) {
            throw new InvalidEventTransitionException(event.getStatus(), "rechazar");
        }
        event.reject(reason);
        Event saved = eventRepository.save(event);
        audit("EVENT_REJECTED", saved, actingUserId);
        return saved;
    }

    public Event publish(UUID eventId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Event event = getOrThrow(eventId);
        if (event.getStatus() != EventStatus.APPROVED) {
            throw new InvalidEventTransitionException(event.getStatus(), "publicar");
        }
        event.publishNow();
        Event saved = eventRepository.save(event);
        audit("EVENT_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Event schedule(UUID eventId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidEventScheduleException("La fecha de publicación programada debe ser futura");
        }
        Event event = getOrThrow(eventId);
        if (event.getStatus() != EventStatus.APPROVED) {
            throw new InvalidEventTransitionException(event.getStatus(), "programar");
        }
        event.schedule(when);
        Event saved = eventRepository.save(event);
        audit("EVENT_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Event archive(UUID eventId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Event event = getOrThrow(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new InvalidEventTransitionException(event.getStatus(), "archivar");
        }
        event.archive();
        Event saved = eventRepository.save(event);
        audit("EVENT_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Event getForAdmin(UUID eventId, UUID actingUserId, Role actingRole) {
        Event event = getOrThrow(eventId);
        if (!isEditorOrAbove(actingRole) && !event.isOwnedBy(actingUserId)) {
            throw new EventAccessDeniedException();
        }
        return event;
    }

    public List<Event> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return eventRepository.findAll();
        }
        return eventRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Event getPublishedBySlug(String slug) {
        return eventRepository.findBySlugAndStatus(slug, EventStatus.PUBLISHED)
                .orElseThrow(() -> new EventNotFoundException(slug));
    }

    /**
     * Listado público separado en próximos/pasados (razón de ser de este
     * módulo — ver EventRepository). `upcoming=true` por defecto en el
     * controller.
     */
    public Page<Event> listPublished(UUID categoryId, boolean upcoming, Pageable pageable) {
        Instant now = Instant.now();
        if (upcoming) {
            return eventRepository.findUpcoming(EventStatus.PUBLISHED, now, categoryId, pageable);
        }
        return eventRepository.findPast(EventStatus.PUBLISHED, now, categoryId, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que ArticleService/PlaceService.search (query en blanco: página vacía, no error). */
    public Page<Event> search(String query, UUID categoryId, Instant from, Instant to, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return eventRepository.search(query.trim(), categoryId, from, to, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<EventStatus, Long> countByStatus() {
        Map<EventStatus, Long> counts = new EnumMap<>(EventStatus.class);
        for (EventStatus status : EventStatus.values()) {
            counts.put(status, eventRepository.countByStatus(status));
        }
        return counts;
    }

    private void validatePlace(UUID placeId) {
        if (placeId != null && !placeService.existsById(placeId)) {
            throw new EventPlaceNotFoundException(placeId);
        }
    }

    private void validateDateRange(Instant startsAt, Instant endsAt) {
        if (endsAt != null && endsAt.isBefore(startsAt)) {
            throw new InvalidEventDateRangeException();
        }
    }

    private List<ContentImage> validateImages(List<ContentImageInput> images) {
        if (images == null) {
            return new ArrayList<>();
        }
        List<ContentImage> result = new ArrayList<>(images.size());
        for (ContentImageInput input : images) {
            if (!input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
                throw new InvalidEventImageException();
            }
            if (input.hasImageId()) {
                imageService.getOrThrow(input.imageId());
                result.add(ContentImage.uploaded(input.imageId(), input.title(), input.caption()));
            } else {
                result.add(ContentImage.external(input.externalUrl(), input.title(), input.caption()));
            }
        }
        return result;
    }

    /** Nunca se persiste la URL cruda: solo el Video ID (sección 8). Uno por cada video pegado. */
    private List<ContentVideo> resolveVideos(List<ContentVideoInput> videos) {
        if (videos == null) {
            return new ArrayList<>();
        }
        List<ContentVideo> result = new ArrayList<>(videos.size());
        for (ContentVideoInput input : videos) {
            if (input.url() == null || input.url().isBlank()) {
                continue;
            }
            String videoId = YouTubeUrlParser.extractVideoId(input.url())
                    .orElseThrow(() -> new InvalidEventYouTubeUrlException(input.url()));
            result.add(new ContentVideo(videoId, input.title(), input.caption()));
        }
        return result;
    }

    private void requireCanEdit(Event event, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!event.isEditable()) {
                throw new InvalidEventTransitionException(event.getStatus(), "editar");
            }
            return;
        }
        if (!event.isOwnedBy(actingUserId)) {
            throw new EventAccessDeniedException();
        }
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.REJECTED) {
            throw new InvalidEventTransitionException(event.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new EventAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Event getOrThrow(UUID id) {
        return eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (eventRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, Event event, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "event", event.getId().toString(),
                null);
    }
}
