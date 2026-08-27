package pe.plataformacontenidos.events.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectEventRequest(@NotBlank String reason) {
}
