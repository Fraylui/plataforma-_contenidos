package pe.plataformacontenidos.places.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectPlaceRequest(@NotBlank String reason) {
}
