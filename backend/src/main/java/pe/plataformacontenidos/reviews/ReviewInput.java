package pe.plataformacontenidos.reviews;

import java.util.List;
import java.util.UUID;

/**
 * Entrada de creación/edición de reseña, ya validada en el DTO de API
 * (incluido el rango de rating). geographyId, placeId, subjectName,
 * imageIds y youtubeUrl son opcionales.
 */
public record ReviewInput(
        String title,
        String excerpt,
        String body,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String subjectName,
        int rating,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {
}
