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
import pe.plataformacontenidos.identity.permission.PublishPermissionRequiredException;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideo;
import pe.plataformacontenidos.shared.ContentVideoInput;
import pe.plataformacontenidos.shared.HtmlSanitizer;
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
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryService categoryService;
    private final AuditService auditService;
    private final ImageService imageService;

    public ArticleService(ArticleRepository articleRepository, CategoryService categoryService,
            AuditService auditService, ImageService imageService) {
        this.articleRepository = articleRepository;
        this.categoryService = categoryService;
        this.auditService = auditService;
        this.imageService = imageService;
    }

    public Article create(ArticleInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Article article = new Article(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), sanitizedBody,
                input.articleType(), authorId, input.categoryId());
        article.updateContent(input.title(), input.excerpt(), sanitizedBody, input.articleType(), input.categoryId(),
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());

        Article saved = articleRepository.save(article);
        audit("ARTICLE_CREATED", saved, authorId);
        return saved;
    }

    public Article update(UUID articleId, ArticleInput input, UUID actingUserId, boolean canPublish) {
        Article article = getOrThrow(articleId);
        requireCanEdit(article, actingUserId, canPublish);

        if (!article.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        article.updateContent(input.title(), input.excerpt(), sanitizedBody, input.articleType(), input.categoryId(),
                input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());
        Article saved = articleRepository.save(article);
        audit("ARTICLE_UPDATED", saved, actingUserId);
        return saved;
    }

    /** Quien solo crea lo manda a quien publica (Pendiente de aprobación). */
    public Article submit(UUID articleId, UUID actingUserId) {
        Article article = getOrThrow(articleId);
        if (!article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        article.submitForApproval();
        return saveAndAudit(article, "ARTICLE_SUBMITTED", actingUserId);
    }

    public Article publish(UUID articleId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Article article = getOrThrow(articleId);
        article.publishNow(Instant.now());
        return saveAndAudit(article, "ARTICLE_PUBLISHED", actingUserId);
    }

    public Article schedule(UUID articleId, Instant when, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Article article = getOrThrow(articleId);
        article.schedule(when, Instant.now());
        return saveAndAudit(article, "ARTICLE_SCHEDULED", actingUserId);
    }

    /** Devuelve a borrador lo pendiente o programado, con una nota opcional para quien lo creó. */
    public Article returnToDraft(UUID articleId, String note, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Article article = getOrThrow(articleId);
        article.returnToDraft(note);
        return saveAndAudit(article, "ARTICLE_RETURNED_TO_DRAFT", actingUserId);
    }

    public Article archive(UUID articleId, UUID actingUserId, boolean canPublish) {
        requirePublish(canPublish);
        Article article = getOrThrow(articleId);
        article.archive();
        return saveAndAudit(article, "ARTICLE_ARCHIVED", actingUserId);
    }

    public Article getForAdmin(UUID articleId, UUID actingUserId, boolean canPublish) {
        Article article = getOrThrow(articleId);
        if (!canPublish && !article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        return article;
    }

    public List<Article> listForAdmin(UUID actingUserId, boolean canPublish) {
        if (canPublish) {
            return articleRepository.findAll();
        }
        return articleRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Article getPublishedBySlug(String slug) {
        return articleRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new ArticleNotFoundException(slug));
    }

    public Page<Article> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return articleRepository.findByStatusAndCategoryId(PublicationStatus.PUBLISHED, categoryId, pageable);
        }
        return articleRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Query en blanco: página vacía, no error — evita un 400 por un input trivial. */
    public Page<Article> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return articleRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<PublicationStatus, Long> countByStatus() {
        Map<PublicationStatus, Long> counts = new EnumMap<>(PublicationStatus.class);
        for (PublicationStatus status : PublicationStatus.values()) {
            counts.put(status, articleRepository.countByStatus(status));
        }
        return counts;
    }

    public long countPublishedSince(Instant threshold) {
        return articleRepository.countByStatusAndPublishedAtAfter(PublicationStatus.PUBLISHED, threshold);
    }

    /** Ver StatsService.trend — un conteo por día (UTC), solo los días con al menos una publicación. */
    public Map<LocalDate, Long> publishedCountsByDaySince(Instant threshold) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (ArticleRepository.DailyCountRow row : articleRepository.countPublishedByDaySince(threshold)) {
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
                throw new InvalidArticleImageException();
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

    private void requireCanEdit(Article article, UUID actingUserId, boolean canPublish) {
        if (!canPublish && !article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        boolean editable = canPublish ? article.isEditableByPublisher() : article.isEditableByCreator();
        if (!editable) {
            throw new InvalidPublicationTransitionException(article.getStatus(), "editar");
        }
    }



    private Article getOrThrow(UUID id) {
        return articleRepository.findById(id).orElseThrow(() -> new ArticleNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (articleRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private Article saveAndAudit(Article article, String action, UUID actingUserId) {
        Article saved = articleRepository.save(article);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Article article, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "article", article.getId().toString(),
                null);
    }

    /** Publicar, programar, devolver a borrador y archivar exigen nivel PUBLISH en el módulo (spec 2a §4.2). */
    private static void requirePublish(boolean canPublish) {
        if (!canPublish) {
            throw new PublishPermissionRequiredException();
        }
    }
}
