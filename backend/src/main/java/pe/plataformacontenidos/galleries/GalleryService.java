package pe.plataformacontenidos.galleries;

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
import pe.plataformacontenidos.identity.permission.PublishPermissionRequiredException;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/**
 * Orquesta el ciclo de publicación de Galerías (CONTEXTO.md sección 12), mismo
 * patrón que EventService/PlaceService. La autorización a nivel de objeto
 * vive acá (SecurityConfig solo decide quién llega al endpoint).
 */
@Service
@Transactional
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final CategoryService categoryService;
    private final ImageService imageService;
    private final AuditService auditService;

    public GalleryService(GalleryRepository galleryRepository, CategoryService categoryService,
            ImageService imageService, AuditService auditService) {
        this.galleryRepository = galleryRepository;
        this.categoryService = categoryService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public Gallery create(GalleryInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());

        Gallery gallery = new Gallery(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), authorId,
                input.categoryId());
        gallery.updateContent(input.title(), input.excerpt(), input.categoryId(), images,
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), input.robots());

        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_CREATED", saved, authorId);
        return saved;
    }

    public Gallery update(UUID galleryId, GalleryInput input, UUID actingUserId, boolean canPublish) {
        Gallery gallery = getOrThrow(galleryId);
        requireCanEdit(gallery, actingUserId, canPublish);

        if (!gallery.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());

        gallery.updateContent(input.title(), input.excerpt(), input.categoryId(), images,
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(), input.ogImageUrl(), input.robots());
        Gallery saved = galleryRepository.save(gallery);
        audit("GALLERY_UPDATED", saved, actingUserId);
        return saved;
    }

    /** Quien solo crea lo manda a quien publica (Pendiente de aprobación). */
    public Gallery submit(UUID galleryId, UUID actingUserId) {
        Gallery gallery = getOrThrow(galleryId);
        if (!gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        gallery.submitForApproval();
        return saveAndAudit(gallery, "GALLERY_SUBMITTED", actingUserId);
    }

    public Gallery publish(UUID galleryId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Gallery gallery = getOrThrow(galleryId);
        gallery.publishNow(Instant.now());
        return saveAndAudit(gallery, "GALLERY_PUBLISHED", actingUserId);
    }

    public Gallery schedule(UUID galleryId, Instant when, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Gallery gallery = getOrThrow(galleryId);
        gallery.schedule(when, Instant.now());
        return saveAndAudit(gallery, "GALLERY_SCHEDULED", actingUserId);
    }

    /** Devuelve a borrador lo pendiente o programado, con una nota opcional para quien lo creó. */
    public Gallery returnToDraft(UUID galleryId, String note, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Gallery gallery = getOrThrow(galleryId);
        gallery.returnToDraft(note);
        return saveAndAudit(gallery, "GALLERY_RETURNED_TO_DRAFT", actingUserId);
    }

    public Gallery archive(UUID galleryId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Gallery gallery = getOrThrow(galleryId);
        gallery.archive();
        return saveAndAudit(gallery, "GALLERY_ARCHIVED", actingUserId);
    }

    public Gallery getForAdmin(UUID galleryId, UUID actingUserId, boolean canPublish) {
        Gallery gallery = getOrThrow(galleryId);
        if (!canPublish && !gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        return gallery;
    }

    public List<Gallery> listForAdmin(UUID actingUserId, boolean canPublish) {
        if (canPublish) {
            return galleryRepository.findAll();
        }
        return galleryRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Gallery getPublishedBySlug(String slug) {
        return galleryRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new GalleryNotFoundException(slug));
    }

    public Page<Gallery> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return galleryRepository.findByStatusAndCategoryId(PublicationStatus.PUBLISHED, categoryId, pageable);
        }
        return galleryRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que el resto de módulos.search (query en blanco: página vacía, no error). */
    public Page<Gallery> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return galleryRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PublicationStatus, Long> countByStatus() {
        Map<PublicationStatus, Long> counts = new EnumMap<>(PublicationStatus.class);
        for (PublicationStatus status : PublicationStatus.values()) {
            counts.put(status, galleryRepository.countByStatus(status));
        }
        return counts;
    }

    /** A diferencia de Place/Event (fotos opcionales), acá el contenido ES la colección: al menos una imagen. */
    private List<ContentImage> validateImages(List<ContentImageInput> images) {
        if (images == null || images.isEmpty()) {
            throw new InvalidGalleryImageCountException();
        }
        List<ContentImage> result = new ArrayList<>(images.size());
        for (ContentImageInput input : images) {
            if (!input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
                throw new InvalidGalleryImageException();
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

    private void requireCanEdit(Gallery gallery, UUID actingUserId, boolean canPublish) {
        if (!canPublish && !gallery.isOwnedBy(actingUserId)) {
            throw new GalleryAccessDeniedException();
        }
        boolean editable = canPublish ? gallery.isEditableByPublisher() : gallery.isEditableByCreator();
        if (!editable) {
            throw new InvalidPublicationTransitionException(gallery.getStatus(), "editar");
        }
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

    private Gallery saveAndAudit(Gallery gallery, String action, UUID actingUserId) {
        Gallery saved = galleryRepository.save(gallery);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Gallery gallery, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "gallery", gallery.getId().toString(),
                null);
    }

    /** Publicar, programar, devolver a borrador y archivar exigen nivel PUBLISH en el módulo (spec 2a §4.2). */
    private static void requirePublish(boolean canPublish) {
        if (!canPublish) {
            throw new PublishPermissionRequiredException();
        }
    }
}
