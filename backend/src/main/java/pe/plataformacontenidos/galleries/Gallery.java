package pe.plataformacontenidos.galleries;

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
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Página de Galería: colección de fotografías con título y descripción
 * breve — a diferencia de Artículo/Lugar/Evento, no tiene cuerpo de texto
 * largo: el contenido ES la colección de fotos (ver GalleryService, que
 * exige al menos una imagen). Mismo flujo editorial que el resto (sección
 * 12). category_id/geography_id son UUID sin FK (Taxonomy/Geography,
 * sección 38); imageIds tampoco (Media).
 */
@Entity
@Table(name = "galleries", schema = "galleries")
public class Gallery {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String excerpt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GalleryStatus status = GalleryStatus.DRAFT;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "geography_id")
    private UUID geographyId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "gallery_images", schema = "galleries", joinColumns = @JoinColumn(name = "gallery_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "image_id")
    private List<UUID> imageIds = new ArrayList<>();

    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "meta_description")
    private String metaDescription;

    @Column(name = "canonical_url")
    private String canonicalUrl;

    @Column(name = "og_image_url")
    private String ogImageUrl;

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

    protected Gallery() {
        // JPA
    }

    public Gallery(String slug, String title, String excerpt, UUID authorId, UUID categoryId) {
        this.slug = slug;
        this.title = title;
        this.excerpt = excerpt;
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

    public GalleryStatus getStatus() {
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

    public List<UUID> getImageIds() {
        return imageIds;
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

    public boolean isOwnedBy(UUID userId) {
        return authorId.equals(userId);
    }

    public boolean isEditable() {
        return status == GalleryStatus.DRAFT || status == GalleryStatus.IN_REVIEW
                || status == GalleryStatus.APPROVED || status == GalleryStatus.REJECTED;
    }

    public void updateContent(String title, String excerpt, UUID categoryId, UUID geographyId, List<UUID> imageIds,
            String seoTitle, String metaDescription, String canonicalUrl, String ogImageUrl, String robots) {
        this.title = title;
        this.excerpt = excerpt;
        this.categoryId = categoryId;
        this.geographyId = geographyId;
        this.imageIds = new ArrayList<>(imageIds);
        this.seoTitle = seoTitle;
        this.metaDescription = metaDescription;
        this.canonicalUrl = canonicalUrl;
        this.ogImageUrl = ogImageUrl;
        this.robots = (robots == null || robots.isBlank()) ? "index,follow" : robots;
        this.updatedAt = Instant.now();
    }

    public void submitForReview() {
        this.status = GalleryStatus.IN_REVIEW;
        this.rejectionReason = null;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = GalleryStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = GalleryStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = Instant.now();
    }

    public void publishNow() {
        this.status = GalleryStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.scheduledAt = null;
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant when) {
        this.status = GalleryStatus.SCHEDULED;
        this.scheduledAt = when;
        this.updatedAt = Instant.now();
    }

    /** Usado por el job de publicación programada cuando scheduledAt ya pasó. */
    void publishFromSchedule() {
        this.status = GalleryStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = GalleryStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }
}
