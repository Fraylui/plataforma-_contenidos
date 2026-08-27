package pe.plataformacontenidos.reviews.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectReviewRequest(@NotBlank String reason) {
}
