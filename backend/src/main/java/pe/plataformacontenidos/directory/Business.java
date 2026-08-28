package pe.plataformacontenidos.directory;

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
 * Ficha de Directorio (CONTEXTO.md sección 6: empresas, restaurantes,
 * hoteles, servicios/negocios locales). Mismo flujo editorial que el resto
 * (sección 12); a diferencia de Reseña (que opina sobre un lugar), esta
 * ficha ES el negocio. Puede vincularse a un Lugar ya existente (placeId)
 * o llevar su propia dirección libre (address) — mismo patrón que
 * events.placeId/venueName. category_id/geography_id/place_id son UUID
 * sin FK (Taxonomy/Geography/Places, sección 38); imageIds tampoco (Media).
 */
@Entity
@Table(name = "businesses", schema = "directory")
public class Business {

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
    private BusinessStatus status = BusinessStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false)
    private BusinessType businessType;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "geography_id")
    private UUID geographyId;

    @Column(name = "place_id")
    private UUID placeId;

    private String address;
    private String phone;
    private String email;
    private String website;

    private Double latitude;
    private Double longitude;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "business_images", schema = "directory", joinColumns = @JoinColumn(name = "business_id"))
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

    protected Business() {
        // JPA
    }

    public Business(String slug, String name, String excerpt, String body, UUID authorId, UUID categoryId,
            BusinessType businessType) {
        this.slug = slug;
        this.name = name;
        this.excerpt = excerpt;
        this.body = body;
        this.authorId = authorId;
        this.categoryId = categoryId;
        this.businessType = businessType;
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

    public BusinessStatus getStatus() {
        return status;
    }

    public BusinessType getBusinessType() {
        return businessType;
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

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getWebsite() {
        return website;
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
        return status == BusinessStatus.DRAFT || status == BusinessStatus.IN_REVIEW
                || status == BusinessStatus.APPROVED || status == BusinessStatus.REJECTED;
    }

    public void updateContent(String name, String excerpt, String body, UUID categoryId, UUID geographyId,
            BusinessType businessType, UUID placeId, String address, String phone, String email, String website,
            Double latitude, Double longitude, List<UUID> imageIds, String seoTitle, String metaDescription,
            String canonicalUrl, String ogImageUrl, String youtubeVideoId, String robots) {
        this.name = name;
        this.excerpt = excerpt;
        this.body = body;
        this.categoryId = categoryId;
        this.geographyId = geographyId;
        this.businessType = businessType;
        this.placeId = placeId;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.website = website;
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
        this.status = BusinessStatus.IN_REVIEW;
        this.rejectionReason = null;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        this.status = BusinessStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = BusinessStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = Instant.now();
    }

    public void publishNow() {
        this.status = BusinessStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.scheduledAt = null;
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant when) {
        this.status = BusinessStatus.SCHEDULED;
        this.scheduledAt = when;
        this.updatedAt = Instant.now();
    }

    /** Usado por el job de publicación programada cuando scheduledAt ya pasó. */
    void publishFromSchedule() {
        this.status = BusinessStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = BusinessStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }
}
