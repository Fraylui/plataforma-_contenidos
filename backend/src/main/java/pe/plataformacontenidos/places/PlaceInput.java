package pe.plataformacontenidos.places;

import java.util.List;
import java.util.UUID;

/**
 * Entrada de creación/edición de lugar, ya validada en el DTO de API.
 * geographyId, coordenadas, imageIds y youtubeUrl son opcionales.
 * youtubeUrl es la URL pegada por el redactor (sección 8); PlaceService la
 * convierte al Video ID antes de guardar, igual que Article.
 */
public record PlaceInput(
        String name,
        String excerpt,
        String body,
        UUID categoryId,
        UUID geographyId,
        Double latitude,
        Double longitude,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {
}
