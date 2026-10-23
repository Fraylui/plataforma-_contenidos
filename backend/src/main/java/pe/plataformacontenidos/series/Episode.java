package pe.plataformacontenidos.series;

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

/**
 * Episodio de una serie: un video de YouTube (solo su id de 11 caracteres;
 * la miniatura la sirve YouTube). Se publica al llegar — decisión del dueño:
 * todo lo que está en la lista de YouTube se ve en el sitio — y se puede
 * archivar para ocultarlo sin tocar YouTube.
 */
@Entity
@Table(name = "episodes", schema = "series")
public class Episode {

    public enum Status { PUBLISHED, ARCHIVED }

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "series_id", nullable = false, updatable = false)
    private UUID seriesId;

    @Column(name = "youtube_video_id", nullable = false, updatable = false)
    private String youtubeVideoId;

    @Column(nullable = false, updatable = false)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String description;

    /** Notas propias del equipo (HTML saneado); YouTube no las sobrescribe al sincronizar. */
    private String notes;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PUBLISHED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Episode() {
        // JPA
    }

    public Episode(UUID seriesId, String youtubeVideoId, String slug, String title, String description, Instant publishedAt) {
        this.seriesId = seriesId;
        this.youtubeVideoId = youtubeVideoId;
        this.slug = slug;
        this.title = title;
        this.description = description;
        this.publishedAt = publishedAt;
    }

    public void updateNotes(String title, String notes) {
        this.title = title;
        this.notes = notes;
    }

    public void archive() {
        status = Status.ARCHIVED;
    }

    public void restore() {
        status = Status.PUBLISHED;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSeriesId() {
        return seriesId;
    }

    public String getYoutubeVideoId() {
        return youtubeVideoId;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Status getStatus() {
        return status;
    }
}
