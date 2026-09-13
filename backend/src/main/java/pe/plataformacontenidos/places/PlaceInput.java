package pe.plataformacontenidos.places;

import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Entrada de creación/edición de lugar, ya validada en el DTO de API.
 * geographyId y coordenadas son opcionales. Cada imagen es subida o por
 * enlace externo (ver ContentImageInput); cada URL de youtubeUrls es la
 * pegada por quien redacta (sección 8) — PlaceService las convierte a
 * Video ID antes de guardar, igual que Article.
 */
public record PlaceInput(
        String name,
        String excerpt,
        String body,
        UUID categoryId,
        UUID geographyId,
        Double latitude,
        Double longitude,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<String> youtubeUrls,
        String robots) {
}
