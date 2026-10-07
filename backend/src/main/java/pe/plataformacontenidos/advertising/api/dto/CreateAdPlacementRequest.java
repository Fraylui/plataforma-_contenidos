package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** `width`/`height` opcionales: sin ellos la posición nace como rectángulo medio (300×250). */
public record CreateAdPlacementRequest(@NotBlank String key, @NotBlank String label, String adsenseSlotId,
        @Min(50) @Max(2000) Integer width, @Min(50) @Max(2000) Integer height) {
}
