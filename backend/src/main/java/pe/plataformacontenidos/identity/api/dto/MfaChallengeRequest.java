package pe.plataformacontenidos.identity.api.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaChallengeRequest(@NotBlank String code) {
}
