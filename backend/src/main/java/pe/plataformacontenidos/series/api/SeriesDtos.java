package pe.plataformacontenidos.series.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.series.Episode;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.series.SeriesService;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/** Cuerpos y respuestas del módulo Series (panel y sitio). */
public final class SeriesDtos {

    private SeriesDtos() {
    }

    public record CreateSeriesRequest(@NotBlank @Size(max = 500) String playlistUrl, @Size(max = 200) String title,
            @Size(max = 2000) String description, @NotNull UUID categoryId) {

        SeriesService.SeriesInput toInput() {
            return new SeriesService.SeriesInput(playlistUrl, title, description, categoryId);
        }
    }

    public record UpdateSeriesRequest(@Size(max = 200) String title, @Size(max = 2000) String description,
            @NotNull UUID categoryId) {

        SeriesService.SeriesInput toInput() {
            return new SeriesService.SeriesInput(null, title, description, categoryId);
        }
    }

    public record AddEpisodeRequest(@NotBlank @Size(max = 500) String videoUrl, @Size(max = 300) String title,
            @Size(max = 5000) String description, Instant publishedAt) {
    }

    /** Panel: incluye el estado de la sincronización con YouTube. */
    public record SeriesResponse(UUID id, String slug, String title, String description, UUID categoryId,
            String youtubePlaylistId, PublicationStatus status, Instant publishedAt, Instant scheduledAt,
            Instant lastSyncedAt, String lastSyncError, Instant createdAt, Instant updatedAt) {

        static SeriesResponse from(Series s) {
            return new SeriesResponse(s.getId(), s.getSlug(), s.getTitle(), s.getDescription(), s.getCategoryId(),
                    s.getYoutubePlaylistId(), s.getStatus(), s.getPublishedAt(), s.getScheduledAt(), s.getLastSyncedAt(),
                    s.getLastSyncError(), s.getCreatedAt(), s.getUpdatedAt());
        }
    }

    /** Sitio: sin datos internos de sincronización. */
    public record PublicSeriesResponse(UUID id, String slug, String title, String description, UUID categoryId,
            String youtubePlaylistId, Instant publishedAt) {

        static PublicSeriesResponse from(Series s) {
            return new PublicSeriesResponse(s.getId(), s.getSlug(), s.getTitle(), s.getDescription(), s.getCategoryId(),
                    s.getYoutubePlaylistId(), s.getPublishedAt());
        }
    }

    public record UpdateEpisodeRequest(@Size(max = 300) String title, @Size(max = 50_000) String notes) {
    }

    public record EpisodeResponse(UUID id, String slug, String youtubeVideoId, String title, String description,
            String notes, Instant publishedAt, Episode.Status status) {

        static EpisodeResponse from(Episode e) {
            return e == null ? null : new EpisodeResponse(e.getId(), e.getSlug(), e.getYoutubeVideoId(), e.getTitle(),
                    e.getDescription(), e.getNotes(), e.getPublishedAt(), e.getStatus());
        }
    }

    /** Portada del listado público: cuántos episodios y el último (su miniatura es la portada). */
    public record SeriesCardResponse(PublicSeriesResponse series, long episodeCount, EpisodeResponse latestEpisode) {

        static SeriesCardResponse from(SeriesService.SeriesCard card) {
            return new SeriesCardResponse(PublicSeriesResponse.from(card.series()), card.episodeCount(),
                    EpisodeResponse.from(card.latest()));
        }
    }

    /** Página de un episodio: con la serie y los vecinos para "siguiente / anterior". */
    public record EpisodeViewResponse(PublicSeriesResponse series, EpisodeResponse episode, EpisodeResponse newer,
            EpisodeResponse older) {

        static EpisodeViewResponse from(SeriesService.EpisodeView view) {
            return new EpisodeViewResponse(PublicSeriesResponse.from(view.series()), EpisodeResponse.from(view.episode()),
                    EpisodeResponse.from(view.newer()), EpisodeResponse.from(view.older()));
        }
    }

    public record SyncResponse(int added, Instant lastSyncedAt, String lastSyncError) {
    }
}
