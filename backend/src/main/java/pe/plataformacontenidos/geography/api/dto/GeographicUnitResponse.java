package pe.plataformacontenidos.geography.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.geography.GeographicUnit;
import pe.plataformacontenidos.geography.GeographyLevel;

public record GeographicUnitResponse(
        UUID id,
        String name,
        String slug,
        GeographyLevel level,
        UUID parentId,
        boolean active) {

    public static GeographicUnitResponse from(GeographicUnit unit) {
        return new GeographicUnitResponse(unit.getId(), unit.getName(), unit.getSlug(), unit.getLevel(),
                unit.getParentId(), unit.isActive());
    }
}
