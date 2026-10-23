package pe.plataformacontenidos.live;

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
 * Transmisión en vivo de YouTube que se ve dentro del sitio. El estado lo
 * marca el equipo en el panel (sin clave de API de YouTube):
 * Programada → En vivo → Terminada, o Cancelada antes de empezar.
 */
@Entity
@Table(name = "streams", schema = "live")
public class LiveStream {

    public enum Status { SCHEDULED, LIVE, ENDED, CANCELLED }

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, updatable = false)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "youtube_video_id", nullable = false)
    private String youtubeVideoId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    /** Serie a la que pertenece (opcional): la página del en vivo la enlaza. */
    @Column(name = "series_id")
    private UUID seriesId;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SCHEDULED;

    @Column(name = "scheduled_start")
    private Instant scheduledStart;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected LiveStream() {
        // JPA
    }

    public LiveStream(String slug, String title, String description, String youtubeVideoId, UUID categoryId,
            UUID seriesId, UUID authorId, Instant scheduledStart) {
        this.slug = slug;
        this.title = title;
        this.description = description;
        this.youtubeVideoId = youtubeVideoId;
        this.categoryId = categoryId;
        this.seriesId = seriesId;
        this.authorId = authorId;
        this.scheduledStart = scheduledStart;
    }

    public void update(String title, String description, String youtubeVideoId, UUID categoryId, UUID seriesId,
            Instant scheduledStart) {
        require(status == Status.SCHEDULED || status == Status.LIVE, "editar");
        this.title = title;
        this.description = description;
        this.youtubeVideoId = youtubeVideoId;
        this.categoryId = categoryId;
        this.seriesId = seriesId;
        this.scheduledStart = scheduledStart;
        touch();
    }

    public void goLive(Instant now) {
        require(status == Status.SCHEDULED, "empezar");
        status = Status.LIVE;
        startedAt = now;
        touch();
    }

    public void end(Instant now) {
        require(status == Status.LIVE, "terminar");
        status = Status.ENDED;
        endedAt = now;
        touch();
    }

    public void cancel() {
        require(status == Status.SCHEDULED, "cancelar");
        status = Status.CANCELLED;
        touch();
    }

    private void touch() {
        updatedAt = Instant.now();
    }

    private void require(boolean allowed, String action) {
        if (!allowed) {
            throw new InvalidLiveStreamException("No se puede " + action + " una transmisión " + label() + ".");
        }
    }

    private String label() {
        return switch (status) {
            case SCHEDULED -> "programada";
            case LIVE -> "en vivo";
            case ENDED -> "terminada";
            case CANCELLED -> "cancelada";
        };
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

    public String getDescription() {
        return description;
    }

    public String getYoutubeVideoId() {
        return youtubeVideoId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getSeriesId() {
        return seriesId;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getScheduledStart() {
        return scheduledStart;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
