package pe.plataformacontenidos.galleries.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectGalleryRequest(@NotBlank String reason) {
}
