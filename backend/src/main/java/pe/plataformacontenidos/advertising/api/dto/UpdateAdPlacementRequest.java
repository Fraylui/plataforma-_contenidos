package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAdPlacementRequest(@NotBlank String label, String adsenseSlotId) {
}
