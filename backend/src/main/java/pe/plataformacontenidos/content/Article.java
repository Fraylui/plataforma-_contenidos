package pe.plataformacontenidos.content;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Un artículo de texto (sección 3: noticia, reportaje, crónica, etc. — todos
 * comparten la misma forma, solo cambia articleType). author_id,
 * category_id y geography_id son UUID sin FK: pertenecen a los módulos
 * Identity, Taxonomy y Geography respectivamente, y este módulo no hace
 * joins cruzados de esquema (CONTEXTO.md sección 38). Se validan en
 * ArticleService llamando a los repositorios/servicios de esos módulos.
 * geography_id es opcional: no todo contenido tiene una ubicación asociada
 * (ej. Tecnología/IA) — ver sección 4, ejemplo "Turismo → Ayacucho →
 * Huamanga".
 */
@Entity
@Table(name = "articles", schema = "content")
public class Article {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String excerpt;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "article_type", nullable = false)
    private ArticleType articleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArticleStatus status = ArticleStatus.DRAFT;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "geography_id")
    private UUID geographyId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "article_tags", schema = "content", joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "tag_id")
    private Set<UUID> tagIds = new HashSet<>();

    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "meta_description")
    private String metaDescription;

    @Column(name = "canonical_url")
    private String canonicalUrl;

    @Column(name = "og_image_url")
    private String ogImageUrl;

    /**
     * Foto destacada para tarjetas/portada — UUID sin FK, igual criterio que
     * geography_id/category_id (pertenece al módulo Media, sección 38).
     * Validada en ArticleService contra ImageService antes de persistir.
     */
    @Column(name = "featured_image_id")
    private UUID featuredImageId;

    /** Solo la referencia (Video ID de YouTube), nunca el video en sí — sección 8. */
    @Column(name = "youtube_video_id")
    private String youtubeVideoId;

    @Column(nullable = false)
    private String robots = "index,follow";

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Article() {
        // JPA
    }

    public Article(String slug, String title, String excerpt, String body, ArticleType articleType,
            UUID authorId, UUID categoryId) {
        this.slug = slug;
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.articleType = articleType;
        this.authorId = authorId;
        this.categoryId = categoryId;
    }

    public UUID getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public String getBody() {
        return body;
    }

    public ArticleType getArticleType() {
        return articleType;
    }

    public ArticleStatus getStatus() {
        return status;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getGeographyId() {
        return geographyId;
    }

    public Set<UUID> getTagIds() {
        return tagIds;
    }

    public String getSeoTitle() {
        return seoTitle;
    }

    public String getMetaDescription() {
        return metaDescription;
    }

    public String getCanonicalUrl() {
        return canonicalUrl;
    }

    public String getOgImageUrl() {
        return ogImageUrl;
    }

    public UUID getFeaturedImageId() {
        return featuredImageId;
    }

    public String getYoutubeVideoId() {
        return youtubeVideoId;
    }

    public String getRobots() {
        return robots;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isOwnedBy(UUID userId) {
        return authorId.equals(userId);
    }

    public boolean isEditable() {
        return status == ArticleStatus.DRAFT || status == ArticleStatus.IN_REVIEW
                || status == ArticleStatus.APPROVED || status == ArticleStatus.REJECTED;
    }

    public void updateContent(String title, String excerpt, String body, ArticleType articleType, UUID categoryId,
            UUID geographyId, Set<UUID> tagIds, String seoTitle, String metaDescription, String canonicalUrl,
            String ogImageUrl, UUID featuredImageId, String youtubeVideoId, String robots) {
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.articleType = articleType;
        this.categoryId = categoryId;
        this.geographyId = geographyId;
        this.tagIds = new HashSet<>(tagIds);
        this.seoTitle = seoTitle;
        this.metaDescription = metaDescription;
        this.canonicalUrl = canonicalUrl;
        this.ogImageUrl = ogImageUrl;
        this.featuredImageId = featuredImageId;
        this.youtubeVideoId = youtubeVideoId;
        this.robots = (robots == null || robots.isBlank()) ? "index,follow" : robots;
        this.updatedAt = Instant.now();
    }

    public void submitForReview() {
        this.status = ArticleStatus.IN_REVIEW;
        this.rejectionReason = null;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = ArticleStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = ArticleStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = Instant.now();
    }

    public void publishNow() {
        this.status = ArticleStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.scheduledAt = null;
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant when) {
        this.status = ArticleStatus.SCHEDULED;
        this.scheduledAt = when;
        this.updatedAt = Instant.now();
    }

    /** Usado por el job de publicación programada cuando scheduledAt ya pasó. */
    void publishFromSchedule() {
        this.status = ArticleStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = ArticleStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }
}
