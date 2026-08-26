package pe.plataformacontenidos.geography.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RenameGeographicUnitRequest(@NotBlank String name) {
}
