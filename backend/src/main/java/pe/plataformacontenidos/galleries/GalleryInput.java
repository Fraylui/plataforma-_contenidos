package pe.plataformacontenidos.galleries;

import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Entrada de creación/edición de galería, ya validada en el DTO de API.
 * images debe tener al menos un elemento (lo valida GalleryService, no el
 * DTO — es una regla de negocio, no de forma). Cada imagen es subida o por
 * enlace externo (ver ContentImageInput), igual que Article/Place/Event.
 */
public record GalleryInput(
        String title,
        String excerpt,
        UUID categoryId,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String robots) {
}
