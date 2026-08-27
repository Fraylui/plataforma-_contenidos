package pe.plataformacontenidos.places;

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
 * Página de Lugar (CONTEXTO.md sección 6): nombre, historia, ubicación,
 * coordenadas, fotografías, video, categoría. Un tipo de contenido más
 * (sección 3), con el mismo flujo editorial que Article (sección 12) — ver
 * PlaceService. category_id/geography_id son UUID sin FK (pertenecen a
 * Taxonomy/Geography, sección 38); imageIds tampoco (pertenecen a Media).
 * Los "artículos relacionados" no se persisten: se derivan en
 * PlaceService a partir de geography_id compartido con content.articles.
 */
@Entity
@Table(name = "places", schema = "places")
public class Place {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    private String excerpt;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceStatus status = PlaceStatus.DRAFT;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "geography_id")
    private UUID geographyId;

    private Double latitude;
    private Double longitude;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "place_images", schema = "places", joinColumns = @JoinColumn(name = "place_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "image_id")
    private List<UUID> imageIds = new ArrayList<>();

    @Column(name = "youtube_video_id")
    private String youtubeVideoId;

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

    protected Place() {
        // JPA
    }

    public Place(String slug, String name, String excerpt, String body, UUID authorId, UUID categoryId) {
        this.slug = slug;
        this.name = name;
        this.excerpt = excerpt;
        this.body = body;
        this.authorId = authorId;
        this.categoryId = categoryId;
    }

    public UUID getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public String getBody() {
        return body;
    }

    public PlaceStatus getStatus() {
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

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public List<UUID> getImageIds() {
        return imageIds;
    }

    public String getYoutubeVideoId() {
        return youtubeVideoId;
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
        return status == PlaceStatus.DRAFT || status == PlaceStatus.IN_REVIEW
                || status == PlaceStatus.APPROVED || status == PlaceStatus.REJECTED;
    }

    public void updateContent(String name, String excerpt, String body, UUID categoryId, UUID geographyId,
            Double latitude, Double longitude, List<UUID> imageIds, String seoTitle, String metaDescription,
            String canonicalUrl, String ogImageUrl, String youtubeVideoId, String robots) {
        this.name = name;
        this.excerpt = excerpt;
        this.body = body;
        this.categoryId = categoryId;
        this.geographyId = geographyId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.imageIds = new ArrayList<>(imageIds);
        this.seoTitle = seoTitle;
        this.metaDescription = metaDescription;
        this.canonicalUrl = canonicalUrl;
        this.ogImageUrl = ogImageUrl;
        this.youtubeVideoId = youtubeVideoId;
        this.robots = (robots == null || robots.isBlank()) ? "index,follow" : robots;
        this.updatedAt = Instant.now();
    }

    public void submitForReview() {
        this.status = PlaceStatus.IN_REVIEW;
        this.rejectionReason = null;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = PlaceStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = PlaceStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = Instant.now();
    }

    public void publishNow() {
        this.status = PlaceStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.scheduledAt = null;
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant when) {
        this.status = PlaceStatus.SCHEDULED;
        this.scheduledAt = when;
        this.updatedAt = Instant.now();
    }

    /** Usado por el job de publicación programada cuando scheduledAt ya pasó. */
    void publishFromSchedule() {
        this.status = PlaceStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = PlaceStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }
}
