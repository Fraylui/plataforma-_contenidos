package pe.plataformacontenidos.content.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectArticleRequest(@NotBlank String reason) {
}
