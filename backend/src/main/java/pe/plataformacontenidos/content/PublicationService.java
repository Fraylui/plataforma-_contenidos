package pe.plataformacontenidos.content;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Orquesta el ciclo de publicación (CONTEXTO.md sección 12). La autorización a
 * nivel de objeto vive aquí (SecurityConfig solo decide quién llega al
 * endpoint, no quién puede tocar QUÉ artículo — ver esa clase).
 */
@Service
@Transactional
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final CategoryService categoryService;
    private final AuditService auditService;
    private final ImageService imageService;

    public PublicationService(PublicationRepository publicationRepository, CategoryService categoryService,
            AuditService auditService, ImageService imageService) {
        this.publicationRepository = publicationRepository;
        this.categoryService = categoryService;
        this.auditService = auditService;
        this.imageService = imageService;
    }

    public Publication create(PublicationInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Publication publication = new Publication(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), sanitizedBody,
                input.publicationType(), authorId, input.categoryId());
        publication.updateContent(input.title(), input.excerpt(), sanitizedBody, input.publicationType(), input.categoryId(),
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());

        Publication saved = publicationRepository.save(publication);
        audit("PUBLICATION_CREATED", saved, authorId);
        return saved;
    }

    public Publication update(UUID publicationId, PublicationInput input, UUID actingUserId) {
        Publication publication = getOrThrow(publicationId);
        requireEditable(publication);

        if (!publication.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        publication.updateContent(input.title(), input.excerpt(), sanitizedBody, input.publicationType(), input.categoryId(),
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());
        Publication saved = publicationRepository.save(publication);
        audit("PUBLICATION_UPDATED", saved, actingUserId);
        return saved;
    }

    public Publication publish(UUID publicationId, UUID actingUserId) {
        Publication publication = getOrThrow(publicationId);
        publication.publishNow(Instant.now());
        return saveAndAudit(publication, "PUBLICATION_PUBLISHED", actingUserId);
    }

    public Publication schedule(UUID publicationId, Instant when, UUID actingUserId) {
        Publication publication = getOrThrow(publicationId);
        publication.schedule(when, Instant.now());
        return saveAndAudit(publication, "PUBLICATION_SCHEDULED", actingUserId);
    }

    /** Cancela la programación: vuelve a borrador. */
    public Publication returnToDraft(UUID publicationId, UUID actingUserId) {
        Publication publication = getOrThrow(publicationId);
        publication.returnToDraft();
        return saveAndAudit(publication, "PUBLICATION_RETURNED_TO_DRAFT", actingUserId);
    }

    public Publication archive(UUID publicationId, UUID actingUserId) {
        Publication publication = getOrThrow(publicationId);
        publication.archive();
        return saveAndAudit(publication, "PUBLICATION_ARCHIVED", actingUserId);
    }

    public Publication getForAdmin(UUID publicationId) {
        return getOrThrow(publicationId);
    }

    /** Página del listado del panel (ver AdminListQuery). */
    public Page<Publication> listForAdmin(AdminListQuery query) {
        return publicationRepository.findAll(query.specification("title"),
                query.pageable("title"));
    }

    public Publication getPublishedBySlug(String slug) {
        return publicationRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new PublicationNotFoundException(slug));
    }

    public Page<Publication> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return publicationRepository.findByStatusAndCategoryId(PublicationStatus.PUBLISHED, categoryId, pageable);
        }
        return publicationRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Query en blanco: página vacía, no error — evita un 400 por un input trivial. */
    public Page<Publication> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return publicationRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PublicationStatus, Long> countByStatus() {
        Map<PublicationStatus, Long> counts = new EnumMap<>(PublicationStatus.class);
        for (PublicationStatus status : PublicationStatus.values()) {
            counts.put(status, publicationRepository.countByStatus(status));
        }
        return counts;
    }

    public long countPublishedSince(Instant threshold) {
        return publicationRepository.countByStatusAndPublishedAtAfter(PublicationStatus.PUBLISHED, threshold);
    }

    /** Ver StatsService.trend — un conteo por día (UTC), solo los días con al menos una publicación. */
    public Map<LocalDate, Long> publishedCountsByDaySince(Instant threshold) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (PublicationRepository.DailyCountRow row : publicationRepository.countPublishedByDaySince(threshold)) {
            LocalDate day = row.getDay().atZone(ZoneOffset.UTC).toLocalDate();
            counts.put(day, row.getCnt());
        }
        return counts;
    }

    /** Mismo patrón que PlaceService.validateImages, pero para una sola imagen (destacada, no galería). */
    /** Cada imagen es subida (se valida contra Media) o un enlace externo (se valida la forma de URL). */
    private List<ContentImage> validateImages(List<ContentImageInput> images) {
        if (images == null) {
            return new ArrayList<>();
        }
        List<ContentImage> result = new ArrayList<>(images.size());
        for (ContentImageInput input : images) {
            if (!input.isValidShape() || (input.hasExternalUrl() && !input.isValidExternalUrl())) {
                throw new InvalidPublicationImageException();
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
                    .orElseThrow(() -> new InvalidYouTubeUrlException(input.url()));
            result.add(new ContentVideo(videoId, input.title(), input.caption()));
        }
        return result;
    }

    private void requireEditable(Publication publication) {
        if (!publication.isEditable()) {
            throw new InvalidPublicationTransitionException(publication.getStatus(), "editar");
        }
    }

    private Publication getOrThrow(UUID id) {
        return publicationRepository.findById(id).orElseThrow(() -> new PublicationNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (publicationRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private Publication saveAndAudit(Publication publication, String action, UUID actingUserId) {
        Publication saved = publicationRepository.save(publication);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Publication publication, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "publication", publication.getId().toString(),
                null);
    }

}
