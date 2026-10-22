package pe.plataformacontenidos.taxonomy.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.taxonomy.Category;

/**
 * Tema en la lista del panel: además de sus datos, cuánto contenido publicado
 * tiene (propio, sin subtemas) y si el visitante lo ve en el sitio.
 */
public record AdminCategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        UUID parentId,
        boolean active,
        int sortOrder,
        long publishedCount,
        boolean visibleOnSite) {

    public static AdminCategoryResponse from(Category category, long publishedCount, boolean visibleOnSite) {
        return new AdminCategoryResponse(category.getId(), category.getName(), category.getSlug(),
                category.getDescription(), category.getParentId(), category.isActive(), category.getSortOrder(),
                publishedCount, visibleOnSite);
    }
}
