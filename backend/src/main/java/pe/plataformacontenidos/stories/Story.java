package pe.plataformacontenidos.stories;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;
import pe.plataformacontenidos.catalog.ContentType;

/**
 * Historia de un tema: foto o fondo de color con un texto corto, que se ve
 * 24 h (o siempre, si es Destacada). Puede llevar a un contenido del sitio o
 * a un Short de YouTube. La foto y el fondo no cambian al editar: otra foto
 * es otra historia.
 */
@Entity
@Table(name = "stories", schema = "stories")
public class Story {

    /** Degradados de marca para las historias de solo texto. */
    public enum Background { SUNSET, OCEAN, FOREST, NIGHT }

    public enum CaptionPosition { TOP, CENTER, BOTTOM }

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "image_id", updatable = false)
    private UUID imageId;

    @Enumerated(EnumType.STRING)
    @Column(updatable = false)
    private Background background;

    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(name = "caption_position", nullable = false)
    private CaptionPosition captionPosition = CaptionPosition.BOTTOM;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_content_type")
    private ContentType linkContentType;

    @Column(name = "link_content_id")
    private UUID linkContentId;

    @Column(name = "youtube_video_id")
    private String youtubeVideoId;

    @Column(nullable = false)
    private boolean highlighted;

    @Column(name = "published_at", nullable = false, updatable = false)
    private Instant publishedAt;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "cta_clicks", nullable = false, insertable = false, updatable = false)
    private int ctaClicks;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Story() {
        // JPA
    }

    Story(UUID categoryId, UUID imageId, Background background, UUID authorId, Instant publishedAt) {
        this.categoryId = categoryId;
        this.imageId = imageId;
        this.background = background;
        this.authorId = authorId;
        this.publishedAt = publishedAt;
        this.expiresAt = StoryRules.expiryFor(publishedAt);
        this.createdAt = publishedAt;
        this.updatedAt = publishedAt;
    }

    void describe(String caption, CaptionPosition position, ContentType linkType, UUID linkId, String youtubeVideoId,
            Instant now) {
        this.caption = caption;
        this.captionPosition = position == null ? CaptionPosition.BOTTOM : position;
        this.linkContentType = linkType;
        this.linkContentId = linkId;
        this.youtubeVideoId = youtubeVideoId;
        this.updatedAt = now;
    }

    void setHighlighted(boolean highlighted, Instant now) {
        this.highlighted = highlighted;
        this.updatedAt = now;
    }

    /** Se ve en el sitio: aún no caduca, o quedó en Destacadas. */
    public boolean isVisible(Instant now) {
        return highlighted || expiresAt.isAfter(now);
    }

    public UUID getId() {
        return id;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getImageId() {
        return imageId;
    }

    public Background getBackground() {
        return background;
    }

    public String getCaption() {
        return caption;
    }

    public CaptionPosition getCaptionPosition() {
        return captionPosition;
    }

    public ContentType getLinkContentType() {
        return linkContentType;
    }

    public UUID getLinkContentId() {
        return linkContentId;
    }

    public String getYoutubeVideoId() {
        return youtubeVideoId;
    }

    public boolean isHighlighted() {
        return highlighted;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public int getCtaClicks() {
        return ctaClicks;
    }

    public UUID getAuthorId() {
        return authorId;
    }
}
