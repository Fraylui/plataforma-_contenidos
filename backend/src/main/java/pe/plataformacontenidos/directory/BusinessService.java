package pe.plataformacontenidos.directory;

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
 * Orquesta el ciclo de publicación de fichas de Directorio (CONTEXTO.md sección
 * 12), mismo patrón que ReviewService/EventService. La autorización a nivel
 * de objeto vive acá (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final CategoryService categoryService;
    private final PlaceService placeService;
    private final ImageService imageService;
    private final AuditService auditService;

    public BusinessService(BusinessRepository businessRepository, CategoryService categoryService,
            PlaceService placeService, ImageService imageService, AuditService auditService) {
        this.businessRepository = businessRepository;
        this.categoryService = categoryService;
        this.placeService = placeService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Business create(BusinessInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validatePlace(input.placeId());
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Business business = new Business(uniqueSlugFrom(input.name()), input.name(), input.excerpt(), sanitizedBody,
                authorId, input.categoryId(), input.businessType());
        business.updateContent(input.name(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.businessType(), input.placeId(), input.address(), input.phone(),
                input.email(), input.website(), input.latitude(), input.longitude(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());

        Business saved = businessRepository.save(business);
        audit("BUSINESS_CREATED", saved, authorId);
        return saved;
    }

    public Business update(UUID businessId, BusinessInput input, UUID actingUserId, Role actingRole) {
        Business business = getOrThrow(businessId);
        requireCanEdit(business, actingUserId, actingRole);

        if (!business.getCategoryId().equals(input.categoryId())
                && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (!Objects.equals(business.getPlaceId(), input.placeId())) {
            validatePlace(input.placeId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        business.updateContent(input.name(), input.excerpt(), sanitizedBody, input.categoryId(),
                input.businessType(), input.placeId(), input.address(), input.phone(),
                input.email(), input.website(), input.latitude(), input.longitude(), images, input.seoTitle(),
                input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), videos, input.robots());
        Business saved = businessRepository.save(business);
        audit("BUSINESS_UPDATED", saved, actingUserId);
        return saved;
    }

    public Business submit(UUID businessId, UUID actingUserId) {
        Business business = getOrThrow(businessId);
        if (!business.isOwnedBy(actingUserId)) {
            throw new BusinessAccessDeniedException();
        }
        if (business.getStatus() != BusinessStatus.DRAFT && business.getStatus() != BusinessStatus.REJECTED) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "enviar a revisión");
        }
        business.submitForReview();
        Business saved = businessRepository.save(business);
        audit("BUSINESS_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Business approve(UUID businessId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Business business = getOrThrow(businessId);
        if (business.getStatus() != BusinessStatus.IN_REVIEW) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "aprobar");
        }
        business.approve();
        Business saved = businessRepository.save(business);
        audit("BUSINESS_APPROVED", saved, actingUserId);
        return saved;
    }

    public Business reject(UUID businessId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Business business = getOrThrow(businessId);
        if (business.getStatus() != BusinessStatus.IN_REVIEW) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "rechazar");
        }
        business.reject(reason);
        Business saved = businessRepository.save(business);
        audit("BUSINESS_REJECTED", saved, actingUserId);
        return saved;
    }

    public Business publish(UUID businessId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Business business = getOrThrow(businessId);
        if (business.getStatus() != BusinessStatus.APPROVED) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "publicar");
        }
        business.publishNow();
        Business saved = businessRepository.save(business);
        audit("BUSINESS_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Business schedule(UUID businessId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidBusinessScheduleException("La fecha de publicación programada debe ser futura");
        }
        Business business = getOrThrow(businessId);
        if (business.getStatus() != BusinessStatus.APPROVED) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "programar");
        }
        business.schedule(when);
        Business saved = businessRepository.save(business);
        audit("BUSINESS_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Business archive(UUID businessId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Business business = getOrThrow(businessId);
        if (business.getStatus() != BusinessStatus.PUBLISHED) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "archivar");
        }
        business.archive();
        Business saved = businessRepository.save(business);
        audit("BUSINESS_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Business getForAdmin(UUID businessId, UUID actingUserId, Role actingRole) {
        Business business = getOrThrow(businessId);
        if (!isEditorOrAbove(actingRole) && !business.isOwnedBy(actingUserId)) {
            throw new BusinessAccessDeniedException();
        }
        return business;
    }

    public List<Business> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return businessRepository.findAll();
        }
        return businessRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Business getPublishedBySlug(String slug) {
        return businessRepository.findBySlugAndStatus(slug, BusinessStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessNotFoundException(slug));
    }

    public Page<Business> listPublished(UUID categoryId, BusinessType businessType, Pageable pageable) {
        if (businessType != null) {
            return businessRepository.findByStatusAndBusinessType(BusinessStatus.PUBLISHED, businessType, pageable);
        }
        if (categoryId != null) {
            return businessRepository.findByStatusAndCategoryId(BusinessStatus.PUBLISHED, categoryId, pageable);
        }
        return businessRepository.findByStatus(BusinessStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que el resto de módulos.search (query en blanco: página vacía, no error). */
    public Page<Business> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return businessRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<BusinessStatus, Long> countByStatus() {
        Map<BusinessStatus, Long> counts = new EnumMap<>(BusinessStatus.class);
        for (BusinessStatus status : BusinessStatus.values()) {
            counts.put(status, businessRepository.countByStatus(status));
        }
        return counts;
    }

    private void validatePlace(UUID placeId) {
        if (placeId != null && !placeService.existsById(placeId)) {
            throw new BusinessPlaceNotFoundException(placeId);
        }
    }

    private List<ContentImage> validateImages(List<ContentImageInput> images) {
        if (images == null) {
            return new ArrayList<>();
        }
        List<ContentImage> result = new ArrayList<>(images.size());
        for (ContentImageInput input : images) {
            if (!input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
                throw new InvalidBusinessImageException();
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
                    .orElseThrow(() -> new InvalidBusinessYouTubeUrlException(input.url()));
            result.add(new ContentVideo(videoId, input.title(), input.caption()));
        }
        return result;
    }

    private void requireCanEdit(Business business, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!business.isEditable()) {
                throw new InvalidBusinessTransitionException(business.getStatus(), "editar");
            }
            return;
        }
        if (!business.isOwnedBy(actingUserId)) {
            throw new BusinessAccessDeniedException();
        }
        if (business.getStatus() != BusinessStatus.DRAFT && business.getStatus() != BusinessStatus.REJECTED) {
            throw new InvalidBusinessTransitionException(business.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new BusinessAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Business getOrThrow(UUID id) {
        return businessRepository.findById(id).orElseThrow(() -> new BusinessNotFoundException(id));
    }

    private String uniqueSlugFrom(String name) {
        String base = Slugify.slugify(name);
        String candidate = base;
        int suffix = 2;
        while (businessRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, Business business, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "business", business.getId().toString(),
                null);
    }
}
