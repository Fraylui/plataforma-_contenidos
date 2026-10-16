package pe.plataformacontenidos.events;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.configuration.PlatformSettingsService;
import pe.plataformacontenidos.content.YouTubeUrlParser;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.RegionNames;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/**
 * Orquesta el ciclo de publicación de Eventos (CONTEXTO.md sección 12), mismo
 * patrón que PublicationService/PlaceService. La autorización a nivel de objeto
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
    private final PlatformSettingsService platformSettingsService;
    private final ZoneId siteZone;

    public EventService(EventRepository eventRepository, CategoryService categoryService,
            PlaceService placeService, ImageService imageService, AuditService auditService,
            PlatformSettingsService platformSettingsService,
            @Value("${site.time-zone:America/Lima}") String siteTimeZone) {
        this.eventRepository = eventRepository;
        this.categoryService = categoryService;
        this.placeService = placeService;
        this.imageService = imageService;
        this.auditService = auditService;
        this.platformSettingsService = platformSettingsService;
        this.siteZone = ZoneId.of(siteTimeZone);
    }

    public Event create(EventInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validatePlace(input.placeId());
        validateDateRange(input.startsAt(), input.endsAt());
        validateRecurrence(input);
        String scopeCountry = scopeCountry(input);
        String scopeRegion = scopeRegion(input, scopeCountry);
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Event event = new Event(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), sanitizedBody,
                authorId, input.categoryId(), input.startsAt());
        event.updateContent(input.title(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.placeId(), input.venueName(), input.startsAt(), input.endsAt(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());
        event.setSchedule(input.recursYearly(), input.allDay(), input.sinceYear());
        event.setScope(scopeCountry, scopeRegion);
        event.refreshNextOccurrence(siteZone, today());

        Event saved = eventRepository.save(event);
        audit("EVENT_CREATED", saved, authorId);
        return saved;
    }

    public Event update(UUID eventId, EventInput input, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        requireEditable(event);

        if (!event.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (!Objects.equals(event.getPlaceId(), input.placeId())) {
            validatePlace(input.placeId());
        }
        validateDateRange(input.startsAt(), input.endsAt());
        validateRecurrence(input);
        String scopeCountry = scopeCountry(input);
        String scopeRegion = scopeRegion(input, scopeCountry);
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        event.updateContent(input.title(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.placeId(), input.venueName(), input.startsAt(), input.endsAt(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());
        event.setSchedule(input.recursYearly(), input.allDay(), input.sinceYear());
        event.setScope(scopeCountry, scopeRegion);
        event.refreshNextOccurrence(siteZone, today());
        Event saved = eventRepository.save(event);
        audit("EVENT_UPDATED", saved, actingUserId);
        return saved;
    }

    public Event publish(UUID eventId, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        event.publishNow(Instant.now());
        return saveAndAudit(event, "EVENT_PUBLISHED", actingUserId);
    }

    public Event schedule(UUID eventId, Instant when, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        event.schedule(when, Instant.now());
        return saveAndAudit(event, "EVENT_SCHEDULED", actingUserId);
    }

    /** Cancela la programación: vuelve a borrador. */
    public Event returnToDraft(UUID eventId, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        event.returnToDraft();
        return saveAndAudit(event, "EVENT_RETURNED_TO_DRAFT", actingUserId);
    }

    public Event archive(UUID eventId, UUID actingUserId) {
        Event event = getOrThrow(eventId);
        event.archive();
        return saveAndAudit(event, "EVENT_ARCHIVED", actingUserId);
    }

    public Event getForAdmin(UUID eventId) {
        return getOrThrow(eventId);
    }

    /** Página del listado del panel (ver AdminListQuery). */
    public Page<Event> listForAdmin(AdminListQuery query) {
        return eventRepository.findAll(query.specification("title"),
                query.pageable("title", "startsAt"));
    }

    public Event getPublishedBySlug(String slug) {
        return eventRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new EventNotFoundException(slug));
    }

    /**
     * Listado público de Celebraciones: lo que viene (desde el inicio de hoy en
     * la zona del sitio, así lo de hoy se ve todo el día) por la próxima vez
     * que toca, o lo pasado (solo fechas únicas: las anuales siempre vuelven).
     */
    public Page<Event> listPublished(UUID categoryId, boolean upcoming, Pageable pageable) {
        Instant startOfToday = NextOccurrence.startOfDay(today(), siteZone);
        if (upcoming) {
            return eventRepository.findUpcoming(PublicationStatus.PUBLISHED, startOfToday, categoryId, pageable);
        }
        return eventRepository.findPast(PublicationStatus.PUBLISHED, startOfToday, categoryId, pageable);
    }

    /**
     * «Hoy se celebra»: las fechas publicadas que tocan hoy (zona del sitio) y
     * se celebran donde está el visitante (cabeceras de Cloudflare), de lo más
     * cercano a lo más general: su región, su país, lo mundial. Sin ubicación
     * (VPN, sin Cloudflare): lo mundial y lo del país del sitio, sin regiones.
     * Son pocas por día, así que se filtra en memoria.
     */
    public List<Event> listToday(String countryHeader, String region, String regionCode) {
        LocalDate today = today();
        String visitorCountry = RegionNames.visitorCountry(countryHeader);
        String country = visitorCountry != null ? visitorCountry : platformSettingsService.get().getHomeCountry();
        String knownRegion = visitorCountry != null ? region : null;
        String knownRegionCode = visitorCountry != null ? regionCode : null;
        return eventRepository.findOccurringBetween(PublicationStatus.PUBLISHED,
                        NextOccurrence.startOfDay(today, siteZone), NextOccurrence.startOfDay(today.plusDays(1), siteZone))
                .stream()
                .filter(event -> event.closenessTo(country, knownRegion, knownRegionCode) >= 0)
                .sorted(Comparator.comparingInt(
                        (Event event) -> event.closenessTo(country, knownRegion, knownRegionCode)).reversed())
                .toList();
    }

    /**
     * Pasa al año siguiente las fechas anuales cuyo día ya pasó (lo llama la
     * tarea diaria, ver EventScheduledPublishJob). Devuelve cuántas movió.
     */
    public int refreshYearlyOccurrences() {
        LocalDate today = today();
        List<Event> stale = eventRepository.findByRecursYearlyTrueAndNextOccurrenceBefore(
                NextOccurrence.startOfDay(today, siteZone));
        stale.forEach(event -> event.refreshNextOccurrence(siteZone, today));
        eventRepository.saveAll(stale);
        return stale.size();
    }

    private LocalDate today() {
        return LocalDate.now(siteZone);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que PublicationService/PlaceService.search (query en blanco: página vacía, no error). */
    public Page<Event> search(String query, UUID categoryId, Instant from, Instant to, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return eventRepository.search(query.trim(), categoryId, from, to, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PublicationStatus, Long> countByStatus() {
        Map<PublicationStatus, Long> counts = new EnumMap<>(PublicationStatus.class);
        for (PublicationStatus status : PublicationStatus.values()) {
            counts.put(status, eventRepository.countByStatus(status));
        }
        return counts;
    }

    private void validatePlace(UUID placeId) {
        if (placeId != null && !placeService.existsById(placeId)) {
            throw new EventPlaceNotFoundException(placeId);
        }
    }

    private void validateRecurrence(EventInput input) {
        if (input.sinceYear() != null && !input.recursYearly()) {
            throw new InvalidEventDateRangeException("«Desde el año» es solo para fechas que se repiten cada año.");
        }
        if (input.sinceYear() != null && (input.sinceYear() < 1 || input.sinceYear() > today().getYear())) {
            throw new InvalidEventDateRangeException("El año de origen tiene que ser un año pasado.");
        }
    }

    /** País del alcance en mayúsculas, o null (= mundial). */
    private String scopeCountry(EventInput input) {
        if (input.scopeCountry() == null || input.scopeCountry().isBlank()) {
            return null;
        }
        String code = RegionNames.countryCode(input.scopeCountry());
        if (code == null) {
            throw new InvalidEventScopeException(
                    "País inválido: «" + input.scopeCountry() + "». Usa el código de 2 letras (PE, CO, MX…).");
        }
        return code;
    }

    /** Región sin espacios sobrantes, o null (= todo el país). Exige país. */
    private String scopeRegion(EventInput input, String scopeCountry) {
        if (input.scopeRegion() == null || input.scopeRegion().isBlank()) {
            return null;
        }
        if (scopeCountry == null) {
            throw new InvalidEventScopeException("Para elegir una región, primero elige su país.");
        }
        return input.scopeRegion().trim().replaceAll(" +", " ");
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

    private void requireEditable(Event event) {
        if (!event.isEditable()) {
            throw new InvalidPublicationTransitionException(event.getStatus(), "editar");
        }
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

    private Event saveAndAudit(Event event, String action, UUID actingUserId) {
        Event saved = eventRepository.save(event);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Event event, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "event", event.getId().toString(),
                null);
    }

}
