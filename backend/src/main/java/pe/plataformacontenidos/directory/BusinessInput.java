package pe.plataformacontenidos.directory;

import java.util.List;
import java.util.UUID;

/**
 * Entrada de creación/edición de ficha de directorio, ya validada en el
 * DTO de API. geographyId, placeId, address, phone, email, website,
 * coordenadas, imageIds y youtubeUrl son opcionales.
 */
public record BusinessInput(
        String name,
        String excerpt,
        String body,
        UUID categoryId,
        UUID geographyId,
        BusinessType businessType,
        UUID placeId,
        String address,
        String phone,
        String email,
        String website,
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
