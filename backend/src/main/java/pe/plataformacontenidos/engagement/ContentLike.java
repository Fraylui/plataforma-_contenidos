package pe.plataformacontenidos.engagement;

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

/** Un "me gusta" anónimo de un lector sobre cualquier tipo de contenido — ver V29__content_likes.sql. */
@Entity
@Table(name = "content_likes", schema = "engagement")
public class ContentLike {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Column(name = "content_id", nullable = false)
    private UUID contentId;

    @Column(name = "visitor_id", nullable = false)
    private UUID visitorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ContentLike() {
        // JPA
    }

    public ContentLike(ContentType contentType, UUID contentId, UUID visitorId) {
        this.contentType = contentType;
        this.contentId = contentId;
        this.visitorId = visitorId;
    }

    public UUID getId() {
        return id;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public UUID getContentId() {
        return contentId;
    }

    public UUID getVisitorId() {
        return visitorId;
    }
}
