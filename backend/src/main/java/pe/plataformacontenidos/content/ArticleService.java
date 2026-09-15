package pe.plataformacontenidos.content;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
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
import pe.plataformacontenidos.taxonomy.TagService;

/**
 * Orquesta el ciclo editorial (CONTEXTO.md sección 12). La autorización a
 * nivel de objeto vive aquí (SecurityConfig solo decide quién llega al
 * endpoint, no quién puede tocar QUÉ artículo — ver esa clase).
 */
@Service
@Transactional
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryService categoryService;
    private final TagService tagService;
    private final AuditService auditService;
    private final ImageService imageService;

    public ArticleService(ArticleRepository articleRepository, CategoryService categoryService,
            TagService tagService, AuditService auditService, ImageService imageService) {
        this.articleRepository = articleRepository;
        this.categoryService = categoryService;
        this.tagService = tagService;
        this.auditService = auditService;
        this.imageService = imageService;
    }

    public Article create(ArticleInput input, UUID authorId) {
        if (!categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        Set<UUID> tagIds = resolveTagNames(input.tagNames());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        Article article = new Article(uniqueSlugFrom(input.title()), input.title(), input.excerpt(), sanitizedBody,
                input.articleType(), authorId, input.categoryId());
        article.updateContent(input.title(), input.excerpt(), sanitizedBody, input.articleType(), input.categoryId(),
                tagIds, input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());

        Article saved = articleRepository.save(article);
        audit("ARTICLE_CREATED", saved, authorId);
        return saved;
    }

    public Article update(UUID articleId, ArticleInput input, UUID actingUserId, Role actingRole) {
        Article article = getOrThrow(articleId);
        requireCanEdit(article, actingUserId, actingRole);

        if (!article.getCategoryId().equals(input.categoryId()) && !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        List<ContentImage> images = validateImages(input.images());
        List<ContentVideo> videos = resolveVideos(input.videos());
        Set<UUID> tagIds = resolveTagNames(input.tagNames());
        String sanitizedBody = HtmlSanitizer.sanitize(input.body());

        article.updateContent(input.title(), input.excerpt(), sanitizedBody, input.articleType(), input.categoryId(),
                tagIds, input.seoTitle(), input.metaDescription(), input.canonicalUrl(),
                input.ogImageUrl(), images, videos, input.robots());
        Article saved = articleRepository.save(article);
        audit("ARTICLE_UPDATED", saved, actingUserId);
        return saved;
    }

    public Article submit(UUID articleId, UUID actingUserId) {
        Article article = getOrThrow(articleId);
        if (!article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        if (article.getStatus() != ArticleStatus.DRAFT && article.getStatus() != ArticleStatus.REJECTED) {
            throw new InvalidArticleTransitionException(article.getStatus(), "enviar a revisión");
        }
        article.submitForReview();
        Article saved = articleRepository.save(article);
        audit("ARTICLE_SUBMITTED", saved, actingUserId);
        return saved;
    }

    public Article approve(UUID articleId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Article article = getOrThrow(articleId);
        if (article.getStatus() != ArticleStatus.IN_REVIEW) {
            throw new InvalidArticleTransitionException(article.getStatus(), "aprobar");
        }
        article.approve();
        Article saved = articleRepository.save(article);
        audit("ARTICLE_APPROVED", saved, actingUserId);
        return saved;
    }

    public Article reject(UUID articleId, String reason, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Article article = getOrThrow(articleId);
        if (article.getStatus() != ArticleStatus.IN_REVIEW) {
            throw new InvalidArticleTransitionException(article.getStatus(), "rechazar");
        }
        article.reject(reason);
        Article saved = articleRepository.save(article);
        audit("ARTICLE_REJECTED", saved, actingUserId);
        return saved;
    }

    public Article publish(UUID articleId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Article article = getOrThrow(articleId);
        if (article.getStatus() != ArticleStatus.APPROVED) {
            throw new InvalidArticleTransitionException(article.getStatus(), "publicar");
        }
        article.publishNow();
        Article saved = articleRepository.save(article);
        audit("ARTICLE_PUBLISHED", saved, actingUserId);
        return saved;
    }

    public Article schedule(UUID articleId, Instant when, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        if (when.isBefore(Instant.now())) {
            throw new InvalidScheduleException("La fecha de publicación programada debe ser futura");
        }
        Article article = getOrThrow(articleId);
        if (article.getStatus() != ArticleStatus.APPROVED) {
            throw new InvalidArticleTransitionException(article.getStatus(), "programar");
        }
        article.schedule(when);
        Article saved = articleRepository.save(article);
        audit("ARTICLE_SCHEDULED", saved, actingUserId);
        return saved;
    }

    public Article archive(UUID articleId, UUID actingUserId, Role actingRole) {
        requireEditorOrAbove(actingRole);
        Article article = getOrThrow(articleId);
        if (article.getStatus() != ArticleStatus.PUBLISHED) {
            throw new InvalidArticleTransitionException(article.getStatus(), "archivar");
        }
        article.archive();
        Article saved = articleRepository.save(article);
        audit("ARTICLE_ARCHIVED", saved, actingUserId);
        return saved;
    }

    public Article getForAdmin(UUID articleId, UUID actingUserId, Role actingRole) {
        Article article = getOrThrow(articleId);
        if (!isEditorOrAbove(actingRole) && !article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        return article;
    }

    public List<Article> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return articleRepository.findAll();
        }
        return articleRepository.findByAuthorIdOrderByCreatedAtDesc(actingUserId);
    }

    public Article getPublishedBySlug(String slug) {
        return articleRepository.findBySlugAndStatus(slug, ArticleStatus.PUBLISHED)
                .orElseThrow(() -> new ArticleNotFoundException(slug));
    }

    /** Navegación anterior (más antiguo)/siguiente (más nuevo) en la vista de lectura, ambos nullable. */
    public ArticleNeighbors getNeighbors(Article article) {
        if (article.getPublishedAt() == null) {
            return new ArticleNeighbors(null, null);
        }
        Article previous = articleRepository
                .findFirstByStatusAndPublishedAtLessThanOrderByPublishedAtDesc(ArticleStatus.PUBLISHED, article.getPublishedAt())
                .orElse(null);
        Article next = articleRepository
                .findFirstByStatusAndPublishedAtGreaterThanOrderByPublishedAtAsc(ArticleStatus.PUBLISHED, article.getPublishedAt())
                .orElse(null);
        return new ArticleNeighbors(previous, next);
    }

    public record ArticleNeighbors(Article previous, Article next) {
    }

    public Page<Article> listPublished(UUID categoryId, Pageable pageable) {
        if (categoryId != null) {
            return articleRepository.findByStatusAndCategoryId(ArticleStatus.PUBLISHED, categoryId, pageable);
        }
        return articleRepository.findByStatus(ArticleStatus.PUBLISHED, pageable);
    }

    /** CONTEXTO.md sección 16. Query en blanco: página vacía, no error — evita un 400 por un input trivial. */
    public Page<Article> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        return articleRepository.search(query.trim(), categoryId, pageable);
    }

    /** CONTEXTO.md sección 34 (estadísticas básicas) — consumido por el módulo Stats. */
    public Map<ArticleStatus, Long> countByStatus() {
        Map<ArticleStatus, Long> counts = new EnumMap<>(ArticleStatus.class);
        for (ArticleStatus status : ArticleStatus.values()) {
            counts.put(status, articleRepository.countByStatus(status));
        }
        return counts;
    }

    public long countPublishedSince(Instant threshold) {
        return articleRepository.countByStatusAndPublishedAtAfter(ArticleStatus.PUBLISHED, threshold);
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

    private void requireCanEdit(Article article, UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            if (!article.isEditable()) {
                throw new InvalidArticleTransitionException(article.getStatus(), "editar");
            }
            return;
        }
        if (!article.isOwnedBy(actingUserId)) {
            throw new ArticleAccessDeniedException();
        }
        if (article.getStatus() != ArticleStatus.DRAFT && article.getStatus() != ArticleStatus.REJECTED) {
            throw new InvalidArticleTransitionException(article.getStatus(), "editar");
        }
    }

    private void requireEditorOrAbove(Role role) {
        if (!isEditorOrAbove(role)) {
            throw new ArticleAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private Article getOrThrow(UUID id) {
        return articleRepository.findById(id).orElseThrow(() -> new ArticleNotFoundException(id));
    }

    private Set<UUID> resolveTagNames(Set<String> tagNames) {
        if (tagNames == null) {
            return new HashSet<>();
        }
        Set<UUID> ids = new HashSet<>();
        for (String name : tagNames) {
            ids.add(tagService.getOrCreate(name).getId());
        }
        return ids;
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

    private void audit(String action, Article article, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "article", article.getId().toString(),
                null);
    }
}
