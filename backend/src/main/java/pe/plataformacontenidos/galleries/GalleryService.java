package pe.plataformacontenidos.galleries;

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
import pe.plataformacontenidos.geography.GeographicUnitNotFoundException;
import pe.plataformacontenidos.geography.GeographicUnitService;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo editorial de Galerías (CONTEXTO.md sección 12), mismo
 * patrón que EventService/PlaceService. La autorización a nivel de objeto
 * vive acá (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final CategoryService categoryService;
    private final GeographicUnitService geographyService;
    private final ImageService imageService;
    private final AuditService auditService;

    public GalleryService(GalleryRepository galleryRepository, CategoryService categoryService,
            GeographicUnitService geographyService, ImageService imageService, AuditService auditService) {
        this.galleryRepository = galleryRepository;
        this.categoryService = categoryService;
        this.geographyService = geographyService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Gallery create(GalleryInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        validateGeography(input.geographyId());
        List<UUID> imageIds = validateImages(input.imageIds());

        Gallery gallery = new Gallery(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), authorId,
                input.categoryId());
        gallery.updateContent(input.title(), input.excerpt(), input.categoryId(), input.geographyId(), imageIds,
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), input.robots());

        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_CREATED", saved, authorId);
        return saved;
    }

    public Gallery update(UUID galleryId, GalleryInput input, UUID actingUserId, Role actingRole) {
        Gallery gallery = getOrThrow(galleryId);
        requireCanEdit(gallery, actingUserId, actingRole);

        if (!gallery.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (!Objects.equals(gallery.getGeographyId(), input.geographyId())) {
            validateGeography(input.geographyId());
        }
        List<UUID> imageIds = validateImages(input.imageIds());

        gallery.updateContent(input.title(), input.excerpt(), input.categoryId(), input.geographyId(), imageIds,
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), input.robots());
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_UPDATED", saved, actingUserId);
        return saved;
    }

    public Gallery submit(UUID galleryId, UUID actingUserId) {
        Gallery gallery = getOrThrow(galleryId);
        if (!gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        if (gallery.getStatus() != GalleryStatus.DRAFT && gallery.getStatus() != GalleryStatus.REJECTED) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "enviar a revisión");
        }
        gallery.submitForReview();
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Gallery approve(UUID galleryId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Gallery gallery = getOrThrow(galleryId);
        if (gallery.getStatus() != GalleryStatus.IN_REVIEW) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "aprobar");
        }
        gallery.approve();
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_APPROVED", saved, actingUserId);
        return saved;
    }

    public Gallery reject(UUID galleryId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Gallery gallery = getOrThrow(galleryId);
        if (gallery.getStatus() != GalleryStatus.IN_REVIEW) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "rechazar");
        }
        gallery.reject(reason);
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_REJECTED", saved, actingUserId);
        return saved;
    }

    public Gallery publish(UUID galleryId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Gallery gallery = getOrThrow(galleryId);
        if (gallery.getStatus() != GalleryStatus.APPROVED) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "publicar");
        }
        gallery.publishNow();
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Gallery schedule(UUID galleryId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidGalleryScheduleException("La fecha de publicación programada debe ser futura");
        }
        Gallery gallery = getOrThrow(galleryId);
        if (gallery.getStatus() != GalleryStatus.APPROVED) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "programar");
        }
        gallery.schedule(when);
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Gallery archive(UUID galleryId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Gallery gallery = getOrThrow(galleryId);
        if (gallery.getStatus() != GalleryStatus.PUBLISHED) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "archivar");
        }
        gallery.archive();
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Gallery getForAdmin(UUID galleryId, UUID actingUserId, Role actingRole) {
        Gallery gallery = getOrThrow(galleryId);
        if (!isEditorOrAbove(actingRole) && !gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        return gallery;
    }

    public List<Gallery> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return galleryRepository.findAll();
        }
        return galleryRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Gallery getPublishedBySlug(String slug) {
        return galleryRepository.findBySlugAndStatus(slug, GalleryStatus.PUBLISHED)
                .orElseThrow(() -> new GalleryNotFoundException(slug));
    }

    public Page<Gallery> listPublished(UUID categoryId, UUID geographyId, Pageable pageable) {
        if (categoryId != null && geographyId != null) {
            return galleryRepository.findByStatusAndCategoryIdAndGeographyId(
                    GalleryStatus.PUBLISHED, categoryId, geographyId, pageable);
        }
        if (categoryId != null) {
            return galleryRepository.findByStatusAndCategoryId(GalleryStatus.PUBLISHED, categoryId, pageable);
        }
        if (geographyId != null) {
            return galleryRepository.findByStatusAndGeographyId(GalleryStatus.PUBLISHED, geographyId, pageable);
        }
        return galleryRepository.findByStatus(GalleryStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que el resto de módulos.search (query en blanco: página vacía, no error). */
    public Page<Gallery> search(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return galleryRepository.search(query.trim(), pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<GalleryStatus, Long> countByStatus() {
        Map<GalleryStatus, Long> counts = new EnumMap<>(GalleryStatus.class);
        for (GalleryStatus status : GalleryStatus.values()) {
            counts.put(status, galleryRepository.countByStatus(status));
        }
        return counts;
    }

    private void validateGeography(UUID geographyId) {
        if (geographyId != null && !geographyService.existsActive(geographyId)) {
            throw new GeographicUnitNotFoundException(geographyId);
        }
    }

    /** A diferencia de Place/Event (fotos opcionales), acá el contenido ES la colección: al menos una imagen. */
    private List<UUID> validateImages(List<UUID> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            throw new InvalidGalleryImageCountException();
        }
        for (UUID imageId : imageIds) {
            imageService.getOrThrow(imageId);
        }
        return new ArrayList<>(imageIds);
    }

    private void requireCanEdit(Gallery gallery, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!gallery.isEditable()) {
                throw new InvalidGalleryTransitionException(gallery.getStatus(), "editar");
            }
            return;
        }
        if (!gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        if (gallery.getStatus() != GalleryStatus.DRAFT && gallery.getStatus() != GalleryStatus.REJECTED) {
            throw new InvalidGalleryTransitionException(gallery.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new GalleryAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Gallery getOrThrow(UUID id) {
        return galleryRepository.findById(id).orElseThrow(() -> new GalleryNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (galleryRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, Gallery gallery, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "gallery", gallery.getId().toString(),
                null);
    }
}
