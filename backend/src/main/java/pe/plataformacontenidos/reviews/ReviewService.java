package pe.plataformacontenidos.reviews;

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
import pe.plataformacontenidos.geography.GeographicUnitNotFoundException;
import pe.plataformacontenidos.geography.GeographicUnitService;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo editorial de Reseñas (CONTEXTO.md sección 12), mismo
 * patrón que EventService/PlaceService. La autorización a nivel de objeto
 * vive acá (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CategoryService categoryService;
    private final GeographicUnitService geographyService;
    private final PlaceService placeService;
    private final ImageService imageService;
    private final AuditService auditService;

    public ReviewService(ReviewRepository reviewRepository, CategoryService categoryService,
            GeographicUnitService geographyService, PlaceService placeService, ImageService imageService,
            AuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.categoryService = categoryService;
        this.geographyService = geographyService;
        this.placeService = placeService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Review create(ReviewInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validateGeography(input.geographyId());
        validatePlace(input.placeId());
        List<UUID> imageIds = validateImages(input.imageIds());
        String youtubeVideoId = resolveYoutubeVideoId(input.youtubeUrl());

        Review review = new Review(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), input.body(),
                authorId, input.categoryId(), input.rating());
        review.updateContent(input.title(), input.excerpt(), input.body(), input.categoryId(), input.geographyId(),
                input.placeId(), input.subjectName(), input.rating(), imageIds, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), youtubeVideoId, input.robots());

        Review saved = reviewRepository.save(review);
        audit("REVIEW_CREATED", saved, authorId);
        return saved;
    }

    public Review update(UUID reviewId, ReviewInput input, UUID actingUserId, Role actingRole) {
        Review review = getOrThrow(reviewId);
        requireCanEdit(review, actingUserId, actingRole);

        if (!review.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (!Objects.equals(review.getGeographyId(), input.geographyId())) {
            validateGeography(input.geographyId());
        }
        if (!Objects.equals(review.getPlaceId(), input.placeId())) {
            validatePlace(input.placeId());
        }
        List<UUID> imageIds = validateImages(input.imageIds());
        String youtubeVideoId = resolveYoutubeVideoId(input.youtubeUrl());

        review.updateContent(input.title(), input.excerpt(), input.body(), input.categoryId(), input.geographyId(),
                input.placeId(), input.subjectName(), input.rating(), imageIds, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), youtubeVideoId, input.robots());
        Review saved = reviewRepository.save(review);
        audit("REVIEW_UPDATED", saved, actingUserId);
        return saved;
    }

    public Review submit(UUID reviewId, UUID actingUserId) {
        Review review = getOrThrow(reviewId);
        if (!review.isOwnedBy(actingUserId)) {
            throw new ReviewAccessDeniedException();
        }
        if (review.getStatus() != ReviewStatus.DRAFT && review.getStatus() != ReviewStatus.REJECTED) {
            throw new InvalidReviewTransitionException(review.getStatus(), "enviar a revisión");
        }
        review.submitForReview();
        Review saved = reviewRepository.save(review);
        audit("REVIEW_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Review approve(UUID reviewId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Review review = getOrThrow(reviewId);
        if (review.getStatus() != ReviewStatus.IN_REVIEW) {
            throw new InvalidReviewTransitionException(review.getStatus(), "aprobar");
        }
        review.approve();
        Review saved = reviewRepository.save(review);
        audit("REVIEW_APPROVED", saved, actingUserId);
        return saved;
    }

    public Review reject(UUID reviewId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Review review = getOrThrow(reviewId);
        if (review.getStatus() != ReviewStatus.IN_REVIEW) {
            throw new InvalidReviewTransitionException(review.getStatus(), "rechazar");
        }
        review.reject(reason);
        Review saved = reviewRepository.save(review);
        audit("REVIEW_REJECTED", saved, actingUserId);
        return saved;
    }

    public Review publish(UUID reviewId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Review review = getOrThrow(reviewId);
        if (review.getStatus() != ReviewStatus.APPROVED) {
            throw new InvalidReviewTransitionException(review.getStatus(), "publicar");
        }
        review.publishNow();
        Review saved = reviewRepository.save(review);
        audit("REVIEW_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Review schedule(UUID reviewId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidReviewScheduleException("La fecha de publicación programada debe ser futura");
        }
        Review review = getOrThrow(reviewId);
        if (review.getStatus() != ReviewStatus.APPROVED) {
            throw new InvalidReviewTransitionException(review.getStatus(), "programar");
        }
        review.schedule(when);
        Review saved = reviewRepository.save(review);
        audit("REVIEW_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Review archive(UUID reviewId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Review review = getOrThrow(reviewId);
        if (review.getStatus() != ReviewStatus.PUBLISHED) {
            throw new InvalidReviewTransitionException(review.getStatus(), "archivar");
        }
        review.archive();
        Review saved = reviewRepository.save(review);
        audit("REVIEW_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Review getForAdmin(UUID reviewId, UUID actingUserId, Role actingRole) {
        Review review = getOrThrow(reviewId);
        if (!isEditorOrAbove(actingRole) && !review.isOwnedBy(actingUserId)) {
            throw new ReviewAccessDeniedException();
        }
        return review;
    }

    public List<Review> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return reviewRepository.findAll();
        }
        return reviewRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Review getPublishedBySlug(String slug) {
        return reviewRepository.findBySlugAndStatus(slug, ReviewStatus.PUBLISHED)
                .orElseThrow(() -> new ReviewNotFoundException(slug));
    }

    public Page<Review> listPublished(UUID categoryId, UUID geographyId, Pageable pageable) {
        if (categoryId != null && geographyId != null) {
            return reviewRepository.findByStatusAndCategoryIdAndGeographyId(
                    ReviewStatus.PUBLISHED, categoryId, geographyId, pageable);
        }
        if (categoryId != null) {
            return reviewRepository.findByStatusAndCategoryId(ReviewStatus.PUBLISHED, categoryId, pageable);
        }
        if (geographyId != null) {
            return reviewRepository.findByStatusAndGeographyId(ReviewStatus.PUBLISHED, geographyId, pageable);
        }
        return reviewRepository.findByStatus(ReviewStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que el resto de módulos.search (query en blanco: página vacía, no error). */
    public Page<Review> search(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return reviewRepository.search(query.trim(), pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<ReviewStatus, Long> countByStatus() {
        Map<ReviewStatus, Long> counts = new EnumMap<>(ReviewStatus.class);
        for (ReviewStatus status : ReviewStatus.values()) {
            counts.put(status, reviewRepository.countByStatus(status));
        }
        return counts;
    }

    private void validateGeography(UUID geographyId) {
        if (geographyId != null && !geographyService.existsActive(geographyId)) {
            throw new GeographicUnitNotFoundException(geographyId);
        }
    }

    private void validatePlace(UUID placeId) {
        if (placeId != null && !placeService.existsById(placeId)) {
            throw new ReviewPlaceNotFoundException(placeId);
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
                .orElseThrow(() -> new InvalidReviewYouTubeUrlException(youtubeUrl));
    }

    private void requireCanEdit(Review review, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!review.isEditable()) {
                throw new InvalidReviewTransitionException(review.getStatus(), "editar");
            }
            return;
        }
        if (!review.isOwnedBy(actingUserId)) {
            throw new ReviewAccessDeniedException();
        }
        if (review.getStatus() != ReviewStatus.DRAFT && review.getStatus() != ReviewStatus.REJECTED) {
            throw new InvalidReviewTransitionException(review.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new ReviewAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Review getOrThrow(UUID id) {
        return reviewRepository.findById(id).orElseThrow(() -> new ReviewNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (reviewRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, Review review, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "review", review.getId().toString(),
                null);
    }
}
