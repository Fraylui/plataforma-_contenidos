package pe.plataformacontenidos.events;

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
 * Página de Evento: título, descripción, fecha/hora de inicio-fin, lugar
 * (opcional, vinculado a un Lugar existente o solo un nombre libre),
 * fotografías, video, categoría. Un tipo de contenido más (sección 3), con
 * el mismo flujo de publicación que Article/Place (sección 12) — ver
 * EventService. category_id/place_id son UUID sin FK (pertenecen a
 * Taxonomy/Places, sección 38); imageIds tampoco (pertenece a Media). A
 * diferencia de Article/Place, el listado público no
 * ordena por published_at sino por starts_at, separando explícitamente
 * "próximos" de "pasados" (ver EventService.listPublished).
 */
@Entity
@Table(name = "events", schema = "events")
public class Event extends PublishableContent {

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

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "place_id")
    private UUID placeId;

    @Column(name = "venue_name")
    private String venueName;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_images", schema = "events", joinColumns = @JoinColumn(name = "event_id"))
    @OrderColumn(name = "sort_order")
    private List<ContentImage> images = new ArrayList<>();

    /** Solo la referencia (Video ID de YouTube), nunca el video en sí — sección 8. Varios videos por evento. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_videos", schema = "events", joinColumns = @JoinColumn(name = "event_id"))
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

    protected Event() {
        // JPA
    }

    public Event(String slug, String title, String excerpt, String body, UUID authorId, UUID categoryId,
            Instant startsAt) {
        this.slug = slug;
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.authorId = authorId;
        this.categoryId = categoryId;
        this.startsAt = startsAt;
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

    public UUID getAuthorId() {
        return authorId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getPlaceId() {
        return placeId;
    }

    public String getVenueName() {
        return venueName;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
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

    public void updateContent(String title, String excerpt, String body, UUID categoryId,
            UUID placeId, String venueName, Instant startsAt, Instant endsAt, List<ContentImage> images,
            String seoTitle, String metaDescription, String canonicalUrl, String ogImageUrl,
            List<ContentVideo> videos, String robots) {
        this.title = title;
        this.excerpt = excerpt;
        this.body = body;
        this.categoryId = categoryId;
        this.placeId = placeId;
        this.venueName = venueName;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
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
