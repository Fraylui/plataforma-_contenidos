package pe.plataformacontenidos.events.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ScheduleEventRequest(@NotNull @Future Instant scheduledAt) {
}
