package pe.plataformacontenidos.content.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ScheduleArticleRequest(@NotNull @Future Instant scheduledAt) {
}
