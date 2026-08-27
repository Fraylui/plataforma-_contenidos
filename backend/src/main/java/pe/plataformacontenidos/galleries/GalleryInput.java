package pe.plataformacontenidos.galleries;

import java.util.List;
import java.util.UUID;

/**
 * Entrada de creación/edición de galería, ya validada en el DTO de API.
 * geographyId es opcional; imageIds debe tener al menos un elemento (lo
 * valida GalleryService, no el DTO — es una regla de negocio, no de forma).
 */
public record GalleryInput(
        String title,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String robots) {
}
