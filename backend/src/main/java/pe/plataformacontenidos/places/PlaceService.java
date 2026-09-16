package pe.plataformacontenidos.places;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
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
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo de publicación de Lugares (CONTEXTO.md sección 12), mismo
 * patrón que ArticleService. La autorización a nivel de objeto vive acá
 * (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final CategoryService categoryService;
    private final ImageService imageService;
    private final AuditService auditService;

    public PlaceService(PlaceRepository placeRepository, CategoryService categoryService,
            ImageService imageService, AuditService auditService) {
        this.placeRepository = placeRepository;
        this.categoryService = categoryService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Place create(PlaceInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Place place = new Place(uniqueSlugFrom(input.name()), input.name(), input.excerpt(), sanitizedBody, authorId,
                input.categoryId());
        place.updateContent(input.name(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.latitude(), input.longitude(), images, input.seoTitle(), input.metaDescription(),
                input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());

        Place saved = placeRepository.save(place);
        audit("PLACE_CREATED", saved, authorId);
        return saved;
    }

    public Place update(UUID placeId, PlaceInput input, UUID actingUserId, Role actingRole) {
        Place place = getOrThrow(placeId);
        requireCanEdit(place, actingUserId, actingRole);

        if (!place.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        place.updateContent(input.name(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.latitude(), input.longitude(), images, input.seoTitle(), input.metaDescription(),
                input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());
        Place saved = placeRepository.save(place);
        audit("PLACE_UPDATED", saved, actingUserId);
        return saved;
    }

    public Place submit(UUID placeId, UUID actingUserId) {
        Place place = getOrThrow(placeId);
        if (!place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        if (place.getStatus() != PlaceStatus.DRAFT && place.getStatus() != PlaceStatus.REJECTED) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "enviar a revisión");
        }
        place.submitForReview();
        Place saved = placeRepository.save(place);
        audit("PLACE_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Place approve(UUID placeId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.IN_REVIEW) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "aprobar");
        }
        place.approve();
        Place saved = placeRepository.save(place);
        audit("PLACE_APPROVED", saved, actingUserId);
        return saved;
    }

    public Place reject(UUID placeId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.IN_REVIEW) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "rechazar");
        }
        place.reject(reason);
        Place saved = placeRepository.save(place);
        audit("PLACE_REJECTED", saved, actingUserId);
        return saved;
    }

    public Place publish(UUID placeId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.APPROVED) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "publicar");
        }
        place.publishNow();
        Place saved = placeRepository.save(place);
        audit("PLACE_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Place schedule(UUID placeId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidScheduleException("La fecha de publicación programada debe ser futura");
        }
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.APPROVED) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "programar");
        }
        place.schedule(when);
        Place saved = placeRepository.save(place);
        audit("PLACE_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Place archive(UUID placeId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.PUBLISHED) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "archivar");
        }
        place.archive();
        Place saved = placeRepository.save(place);
        audit("PLACE_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Place getForAdmin(UUID placeId, UUID actingUserId, Role actingRole) {
        Place place = getOrThrow(placeId);
        if (!isEditorOrAbove(actingRole) && !place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        return place;
    }

    public List<Place> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return placeRepository.findAll();
        }
        return placeRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    /** Usado por otros módulos (ej. Events) para validar un placeId sin exponer el objeto Place completo (sección 38). */
    public boolean existsById(UUID placeId) {
        return placeRepository.existsById(placeId);
    }

    public Place getPublishedBySlug(String slug) {
        return placeRepository.findBySlugAndStatus(slug, PlaceStatus.PUBLISHED)
                .orElseThrow(() -> new PlaceNotFoundException(slug));
    }

    /** Usado por Events para resolver el nombre/slug de un lugar vinculado (placeId) sin exponer su body completo. */
    public Place getPublishedById(UUID placeId) {
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PlaceStatus.PUBLISHED) {
            throw new PlaceNotFoundException(placeId);
        }
        return place;
    }

    public Page<Place> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return placeRepository.findByStatusAndCategoryId(PlaceStatus.PUBLISHED, categoryId, pageable);
        }
        return placeRepository.findByStatus(PlaceStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que ArticleService.search (query en blanco: página vacía, no error). */
    public Page<Place> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return placeRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PlaceStatus, Long> countByStatus() {
        Map<PlaceStatus, Long> counts = new EnumMap<>(PlaceStatus.class);
        for (PlaceStatus status : PlaceStatus.values()) {
            counts.put(status, placeRepository.countByStatus(status));
        }
        return counts;
    }

    private List<ContentImage> validateImages(List<ContentImageInput> images) {
        if (images == null) {
            return new ArrayList<>();
        }
        List<ContentImage> result = new ArrayList<>(images.size());
        for (ContentImageInput input : images) {
            if (!input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
                throw new InvalidPlaceImageException();
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
                    .orElseThrow(() -> new InvalidPlaceYouTubeUrlException(input.url()));
            result.add(new ContentVideo(videoId, input.title(), input.caption()));
        }
        return result;
    }

    private void requireCanEdit(Place place, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!place.isEditable()) {
                throw new InvalidPlaceTransitionException(place.getStatus(), "editar");
            }
            return;
        }
        if (!place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        if (place.getStatus() != PlaceStatus.DRAFT && place.getStatus() != PlaceStatus.REJECTED) {
            throw new InvalidPlaceTransitionException(place.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new PlaceAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Place getOrThrow(UUID id) {
        return placeRepository.findById(id).orElseThrow(() -> new PlaceNotFoundException(id));
    }

    private String uniqueSlugFrom(String name) {
        String base = Slugify.slugify(name);
        String candidate = base;
        int suffix = 2;
        while (placeRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, Place place, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "place", place.getId().toString(),
                null);
    }
}
