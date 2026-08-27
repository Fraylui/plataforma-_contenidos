package pe.plataformacontenidos.places.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SchedulePlaceRequest(@NotNull @Future Instant scheduledAt) {
}
