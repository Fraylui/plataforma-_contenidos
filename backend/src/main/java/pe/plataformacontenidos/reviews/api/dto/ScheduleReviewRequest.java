package pe.plataformacontenidos.reviews.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ScheduleReviewRequest(@NotNull @Future Instant scheduledAt) {
}
