package pe.plataformacontenidos.taxonomy.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.taxonomy.Category;

public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        UUID parentId,
        boolean active,
        int sortOrder) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(),
                category.getDescription(), category.getParentId(), category.isActive(), category.getSortOrder());
    }
}
