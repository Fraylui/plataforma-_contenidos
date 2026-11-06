package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateAdPlacementRequest(@NotBlank String label, String adsenseSlotId,
        @Min(50) @Max(2000) Integer width, @Min(50) @Max(2000) Integer height) {
}
