package pe.plataformacontenidos.galleries.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ScheduleGalleryRequest(@NotNull @Future Instant scheduledAt) {
}
