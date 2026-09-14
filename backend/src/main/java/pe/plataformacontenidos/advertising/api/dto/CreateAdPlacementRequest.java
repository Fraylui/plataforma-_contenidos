package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAdPlacementRequest(@NotBlank String key, @NotBlank String label, String adsenseSlotId) {
}
