package pe.plataformacontenidos.directory.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ScheduleBusinessRequest(@NotNull @Future Instant scheduledAt) {
}
