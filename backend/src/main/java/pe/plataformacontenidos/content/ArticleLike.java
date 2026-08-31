package pe.plataformacontenidos.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/** Un "me gusta" anónimo de un lector sobre un Artículo — ver V28__article_likes.sql. */
@Entity
@Table(name = "article_likes", schema = "content")
public class ArticleLike {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "article_id", nullable = false)
    private UUID articleId;

    @Column(name = "visitor_id", nullable = false)
    private UUID visitorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ArticleLike() {
        // JPA
    }

    public ArticleLike(UUID articleId, UUID visitorId) {
        this.articleId = articleId;
        this.visitorId = visitorId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getArticleId() {
        return articleId;
    }

    public UUID getVisitorId() {
        return visitorId;
    }
}
