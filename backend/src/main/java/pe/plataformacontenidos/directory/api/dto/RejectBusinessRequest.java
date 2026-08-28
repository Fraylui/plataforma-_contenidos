package pe.plataformacontenidos.directory.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectBusinessRequest(@NotBlank String reason) {
}
