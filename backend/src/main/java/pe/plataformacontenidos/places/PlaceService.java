package pe.plataformacontenidos.places;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.content.YouTubeUrlParser;
import pe.plataformacontenidos.content.api.dto.ArticleSummaryResponse;
import pe.plataformacontenidos.geography.GeographicUnitNotFoundException;
import pe.plataformacontenidos.geography.GeographicUnitService;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo editorial de Lugares (CONTEXTO.md sección 12), mismo
 * patrón que ArticleService. La autorización a nivel de objeto vive acá
 * (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class PlaceService {

    private static final int RELATED_ARTICLES_LIMIT = 6;

    private final PlaceRepository placeRepository;
    private final CategoryService categoryService;
    private final GeographicUnitService geographyService;
    private final ImageService imageService;
    private final ArticleService articleService;
    private final AuditService auditService;

    public PlaceService(PlaceRepository placeRepository, CategoryService categoryService,
            GeographicUnitService geographyService, ImageService imageService, ArticleService articleService,
            AuditService auditService) {
        this.placeRepository = placeRepository;
        this.categoryService = categoryService;
        this.geographyService = geographyService;
        this.imageService = imageService;
        this.articleService = articleService;
        this.auditService = auditService;
    }

    public Place create(PlaceInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validateGeography(input.geographyId());
        List<UUID> imageIds = validateImages(input.imageIds());
        String youtubeVideoId = resolveYoutubeVideoId(input.youtubeUrl());

        Place place = new Place(uniqueSlugFrom(input.name()), input.name(), input.excerpt(), input.body(), authorId,
                input.categoryId());
        place.updateContent(input.name(), input.excerpt(), input.body(), input.categoryId(), input.geographyId(),
                input.latitude(), input.longitude(), imageIds, input.seoTitle(), input.metaDescription(),
                input.canonicalUrl(), input.ogImageUrl(), youtubeVideoId, input.robots());

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
        if (!Objects.equals(place.getGeographyId(), input.geographyId())) {
            validateGeography(input.geographyId());
        }
        List<UUID> imageIds = validateImages(input.imageIds());
        String youtubeVideoId = resolveYoutubeVideoId(input.youtubeUrl());

        place.updateContent(input.name(), input.excerpt(), input.body(), input.categoryId(), input.geographyId(),
                input.latitude(), input.longitude(), imageIds, input.seoTitle(), input.metaDescription(),
                input.canonicalUrl(), input.ogImageUrl(), youtubeVideoId, input.robots());
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

    public Place getPublishedBySlug(String slug) {
        return placeRepository.findBySlugAndStatus(slug, PlaceStatus.PUBLISHED)
                .orElseThrow(() -> new PlaceNotFoundException(slug));
    }

    public Page<Place> listPublished(UUID categoryId, UUID geographyId, Pageable pageable) {
        if (categoryId != null && geographyId != null) {
            return placeRepository.findByStatusAndCategoryIdAndGeographyId(
                    PlaceStatus.PUBLISHED, categoryId, geographyId, pageable);
        }
        if (categoryId != null) {
            return placeRepository.findByStatusAndCategoryId(PlaceStatus.PUBLISHED, categoryId, pageable);
        }
        if (geographyId != null) {
            return placeRepository.findByStatusAndGeographyId(PlaceStatus.PUBLISHED, geographyId, pageable);
        }
        return placeRepository.findByStatus(PlaceStatus.PUBLISHED, pageable);
    }

    /**
     * Artículos relacionados (sección 6): artículos publicados que comparten la
     * misma ubicación geográfica que el lugar (sección 4, "Turismo → Ayacucho →
     * Huamanga"). Sin geographyId, no hay forma de relacionar por ubicación —
     * lista vacía, no un error.
     */
    public List<ArticleSummaryResponse> relatedArticles(Place place) {
        if (place.getGeographyId() == null) {
            return List.of();
        }
        var pageable = PageRequest.of(0, RELATED_ARTICLES_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));
        return articleService.listPublished(null, place.getGeographyId(), pageable).stream()
                .map(ArticleSummaryResponse::from).toList();
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PlaceStatus, Long> countByStatus() {
        Map<PlaceStatus, Long> counts = new EnumMap<>(PlaceStatus.class);
        for (PlaceStatus status : PlaceStatus.values()) {
            counts.put(status, placeRepository.countByStatus(status));
        }
        return counts;
    }

    private void validateGeography(UUID geographyId) {
        if (geographyId != null && !geographyService.existsActive(geographyId)) {
            throw new GeographicUnitNotFoundException(geographyId);
        }
    }

    private List<UUID> validateImages(List<UUID> imageIds) {
        if (imageIds == null) {
            return new ArrayList<>();
        }
        for (UUID imageId : imageIds) {
            imageService.getOrThrow(imageId);
        }
        return imageIds;
    }

    /** Nunca se persiste la URL cruda: solo el Video ID (sección 8). */
    private String resolveYoutubeVideoId(String youtubeUrl) {
        if (youtubeUrl == null || youtubeUrl.isBlank()) {
            return null;
        }
        return YouTubeUrlParser.extractVideoId(youtubeUrl)
                .orElseThrow(() -> new InvalidPlaceYouTubeUrlException(youtubeUrl));
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
