package pe.plataformacontenidos.places;

import pe.plataformacontenidos.shared.publishing.PublishableContent;
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
import pe.plataformacontenidos.shared.ContentImage;
import pe.plataformacontenidos.shared.ContentVideo;

/**
 * Página de Lugar (CONTEXTO.md sección 6): nombre, historia, ubicación,
 * coordenadas, fotografías, video, categoría. Un tipo de contenido más
 * (sección 3), con el mismo flujo de publicación que Article (sección 12) — ver
 * PlaceService. category_id es UUID sin FK (pertenece a Taxonomy, sección
 * 38); imageIds tampoco (pertenece a Media).
 */
@Entity
@Table(name = "places", schema = "places")
public class Place extends PublishableContent {

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

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    private Double latitude;
    private Double longitude;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "place_images", schema = "places", joinColumns = @JoinColumn(name = "place_id"))
    @OrderColumn(name = "sort_order")
    private List<ContentImage> images = new ArrayList<>();

    /** Solo la referencia (Video ID de YouTube), nunca el video en sí — sección 8. Varios videos por lugar. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "place_videos", schema = "places", joinColumns = @JoinColumn(name = "place_id"))
    @OrderColumn(name = "sort_order")
    private List<ContentVideo> videos = new ArrayList<>();

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

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

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

    public UUID getAuthorId() {
        return authorId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public List<ContentImage> getImages() {
        return images;
    }

    /** Portada para tarjetas/feed: la primera imagen, o null si no tiene ninguna. */
    public ContentImage getCoverImage() {
        return images.isEmpty() ? null : images.get(0);
    }

    public List<ContentVideo> getVideos() {
        return videos;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isOwnedBy(UUID userId) {
        return authorId.equals(userId);
    }

    public void updateContent(String name, String excerpt, String body, UUID categoryId,
            Double latitude, Double longitude, List<ContentImage> images, String seoTitle, String metaDescription,
            String canonicalUrl, String ogImageUrl, List<ContentVideo> videos, String robots) {
        this.name = name;
        this.excerpt = excerpt;
        this.body = body;
        this.categoryId = categoryId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.images = new ArrayList<>(images);
        this.seoTitle = seoTitle;
        this.metaDescription = metaDescription;
        this.canonicalUrl = canonicalUrl;
        this.ogImageUrl = ogImageUrl;
        this.videos = new ArrayList<>(videos);
        this.robots = (robots == null || robots.isBlank()) ? "index,follow" : robots;
        touch();
    }

}
