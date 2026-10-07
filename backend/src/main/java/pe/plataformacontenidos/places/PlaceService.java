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
import pe.plataformacontenidos.identity.permission.PublishPermissionRequiredException;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

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

    public Place update(UUID placeId, PlaceInput input, UUID actingUserId, boolean canPublish) {
        Place place = getOrThrow(placeId);
        requireCanEdit(place, actingUserId, canPublish);

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

    /** Quien solo crea lo manda a quien publica (Pendiente de aprobación). */
    public Place submit(UUID placeId, UUID actingUserId) {
        Place place = getOrThrow(placeId);
        if (!place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        place.submitForApproval();
        return saveAndAudit(place, "PLACE_SUBMITTED", actingUserId);
    }

    public Place publish(UUID placeId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Place place = getOrThrow(placeId);
        place.publishNow(Instant.now());
        return saveAndAudit(place, "PLACE_PUBLISHED", actingUserId);
    }

    public Place schedule(UUID placeId, Instant when, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Place place = getOrThrow(placeId);
        place.schedule(when, Instant.now());
        return saveAndAudit(place, "PLACE_SCHEDULED", actingUserId);
    }

    /** Devuelve a borrador lo pendiente o programado, con una nota opcional para quien lo creó. */
    public Place returnToDraft(UUID placeId, String note, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Place place = getOrThrow(placeId);
        place.returnToDraft(note);
        return saveAndAudit(place, "PLACE_RETURNED_TO_DRAFT", actingUserId);
    }

    public Place archive(UUID placeId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Place place = getOrThrow(placeId);
        place.archive();
        return saveAndAudit(place, "PLACE_ARCHIVED", actingUserId);
    }

    public Place getForAdmin(UUID placeId, UUID actingUserId, boolean canPublish) {
        Place place = getOrThrow(placeId);
        if (!canPublish && !place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        return place;
    }

    public List<Place> listForAdmin(UUID actingUserId, boolean canPublish) {
        if (canPublish) {
            return placeRepository.findAll();
        }
        return placeRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    /** Usado por otros módulos (ej. Events) para validar un placeId sin exponer el objeto Place completo (sección 38). */
    public boolean existsById(UUID placeId) {
        return placeRepository.existsById(placeId);
    }

    public Place getPublishedBySlug(String slug) {
        return placeRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new PlaceNotFoundException(slug));
    }

    /** Usado por Events para resolver el nombre/slug de un lugar vinculado (placeId) sin exponer su body completo. */
    public Place getPublishedById(UUID placeId) {
        Place place = getOrThrow(placeId);
        if (place.getStatus() != PublicationStatus.PUBLISHED) {
            throw new PlaceNotFoundException(placeId);
        }
        return place;
    }

    public Page<Place> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return placeRepository.findByStatusAndCategoryId(PublicationStatus.PUBLISHED, categoryId, pageable);
        }
        return placeRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Mismo criterio que ArticleService.search (query en blanco: página vacía, no error). */
    public Page<Place> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return placeRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PublicationStatus, Long> countByStatus() {
        Map<PublicationStatus, Long> counts = new EnumMap<>(PublicationStatus.class);
        for (PublicationStatus status : PublicationStatus.values()) {
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

    private void requireCanEdit(Place place, UUID actingUserId, boolean canPublish) {
        if (!canPublish && !place.isOwnedBy(actingUserId)) {
            throw new PlaceAccessDeniedException();
        }
        boolean editable = canPublish ? place.isEditableByPublisher() : place.isEditableByCreator();
        if (!editable) {
            throw new InvalidPublicationTransitionException(place.getStatus(), "editar");
        }
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

    private Place saveAndAudit(Place place, String action, UUID actingUserId) {
        Place saved = placeRepository.save(place);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Place place, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "place", place.getId().toString(),
                null);
    }

    /** Publicar, programar, devolver a borrador y archivar exigen nivel PUBLISH en el módulo (spec 2a §4.2). */
    private static void requirePublish(boolean canPublish) {
        if (!canPublish) {
            throw new PublishPermissionRequiredException();
        }
    }
}
