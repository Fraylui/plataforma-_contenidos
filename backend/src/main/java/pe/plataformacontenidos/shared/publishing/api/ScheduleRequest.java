package pe.plataformacontenidos.shared.publishing.api;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/** Cuerpo de POST /{tipo}/{id}/schedule, igual para los 5 tipos de contenido. */
public record ScheduleRequest(@NotNull @Future Instant scheduledAt) {
}
