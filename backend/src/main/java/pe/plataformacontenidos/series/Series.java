package pe.plataformacontenidos.series;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;
import pe.plataformacontenidos.shared.publishing.PublishableContent;

/**
 * Serie: un programa que se transmite en YouTube (video o podcast) y que el
 * sitio muestra con sus episodios. Conectada a una lista de reproducción; los
 * videos nuevos de la lista llegan solos (SeriesSyncJob). El sitio guarda
 * solo referencias, nunca archivos de video.
 */
@Entity
@Table(name = "series", schema = "series")
public class Series extends PublishableContent {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Column(name = "youtube_playlist_id", nullable = false, unique = true)
    private String youtubePlaylistId;

    /** Arte del programa (imagen de la biblioteca); null = miniatura del último episodio. */
    @Column(name = "cover_image_id")
    private UUID coverImageId;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "last_sync_error")
    private String lastSyncError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Series() {
        // JPA
    }

    public Series(String slug, String title, String description, UUID categoryId, UUID authorId, String youtubePlaylistId) {
        this.slug = slug;
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.authorId = authorId;
        this.youtubePlaylistId = youtubePlaylistId;
    }

    public void update(String title, String description, UUID categoryId, UUID coverImageId) {
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.coverImageId = coverImageId;
        touch();
    }

    /** Cambió algo visible (episodios nuevos o archivados): las cachés que miran updated_at se renuevan. */
    public void touchFeedVersion() {
        touch();
    }

    public void recordSync(Instant when, String error) {
        this.lastSyncedAt = when;
        this.lastSyncError = error;
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

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public UUID getCoverImageId() {
        return coverImageId;
    }

    public String getYoutubePlaylistId() {
        return youtubePlaylistId;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public String getLastSyncError() {
        return lastSyncError;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
