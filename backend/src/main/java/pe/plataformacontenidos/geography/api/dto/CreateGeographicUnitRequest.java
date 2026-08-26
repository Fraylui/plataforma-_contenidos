package pe.plataformacontenidos.geography.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import pe.plataformacontenidos.geography.GeographyLevel;

public record CreateGeographicUnitRequest(@NotBlank String name, @NotNull GeographyLevel level, UUID parentId) {
}
