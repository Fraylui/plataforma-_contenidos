package pe.plataformacontenidos.live.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.live.LiveStream;
import pe.plataformacontenidos.live.LiveStreamService;

/** Cuerpos y respuestas de transmisiones en vivo (panel y sitio). */
public final class LiveDtos {

    private LiveDtos() {
    }

    public record LiveRequest(@NotBlank @Size(max = 500) String videoUrl, @NotBlank @Size(max = 200) String title,
            @Size(max = 2000) String description, @NotNull UUID categoryId, UUID seriesId, Instant scheduledStart) {

        LiveStreamService.LiveInput toInput() {
            return new LiveStreamService.LiveInput(videoUrl, title, description, categoryId, seriesId, scheduledStart);
        }
    }

    public record LiveResponse(UUID id, String slug, String title, String description, String youtubeVideoId,
            UUID categoryId, UUID seriesId, LiveStream.Status status, Instant scheduledStart, Instant startedAt,
            Instant endedAt, Instant createdAt) {

        static LiveResponse from(LiveStream s) {
            return s == null ? null : new LiveResponse(s.getId(), s.getSlug(), s.getTitle(), s.getDescription(),
                    s.getYoutubeVideoId(), s.getCategoryId(), s.getSeriesId(), s.getStatus(), s.getScheduledStart(),
                    s.getStartedAt(), s.getEndedAt(), s.getCreatedAt());
        }
    }
}
