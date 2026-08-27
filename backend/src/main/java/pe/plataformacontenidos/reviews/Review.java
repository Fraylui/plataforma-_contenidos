package pe.plataformacontenidos.reviews;

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
 * Página de Reseña: opinión con calificación (1-5) sobre un Lugar
 * existente o algo que todavía no tiene página propia (subjectName libre
 * — mismo patrón que Event.placeId/venueName). Mismo flujo editorial que
 * el resto (sección 12); a diferencia de Galería, sí tiene cuerpo de
 * texto largo. category_id/geography_id/place_id son UUID sin FK
 * (Taxonomy/Geography/Places, sección 38); imageIds tampoco (Media).
 */
@Entity
@Table(name = "reviews", schema = "reviews")
public class Review {

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
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.DRAFT;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "geography_id")
    private UUID geographyId;

    @Column(name = "place_id")
    private UUID placeId;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(nullable = false)
    private int rating;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "review_images", schema = "reviews", joinColumns = @JoinColumn(name = "review_id"))
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

    protected Review() {
        // JPA
    }

    public Review(String slug, String title, String excerpt, String body, UUID authorId, UUID categoryId,
            int rating) {
        this.slug = slug;
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.authorId = authorId;
        this.categoryId = categoryId;
        this.rating = rating;
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

    public ReviewStatus getStatus() {
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

    public UUID getPlaceId() {
        return placeId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public int getRating() {
        return rating;
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
        return status == ReviewStatus.DRAFT || status == ReviewStatus.IN_REVIEW
                || status == ReviewStatus.APPROVED || status == ReviewStatus.REJECTED;
    }

    public void updateContent(String title, String excerpt, String body, UUID categoryId, UUID geographyId,
            UUID placeId, String subjectName, int rating, List<UUID> imageIds, String seoTitle,
            String metaDescription, String canonicalUrl, String ogImageUrl, String youtubeVideoId, String robots) {
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.categoryId = categoryId;
        this.geographyId = geographyId;
        this.placeId = placeId;
        this.subjectName = subjectName;
        this.rating = rating;
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
        this.status = ReviewStatus.IN_REVIEW;
        this.rejectionReason = null;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = ReviewStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = ReviewStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = Instant.now();
    }

    public void publishNow() {
        this.status = ReviewStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.scheduledAt = null;
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant when) {
        this.status = ReviewStatus.SCHEDULED;
        this.scheduledAt = when;
        this.updatedAt = Instant.now();
    }

    /** Usado por el job de publicación programada cuando scheduledAt ya pasó. */
    void publishFromSchedule() {
        this.status = ReviewStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = ReviewStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }
}
