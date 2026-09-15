package pe.plataformacontenidos.places;

import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

/**
 * Entrada de creación/edición de lugar, ya validada en el DTO de API.
 * Las coordenadas son opcionales. Cada imagen es subida o por enlace
 * externo (ver ContentImageInput); cada video trae la URL pegada por quien
 * redacta (sección 8) — PlaceService la convierte a Video ID antes de
 * guardar, igual que Article.
 */
public record PlaceInput(
        String name,
        String excerpt,
        String body,
        UUID categoryId,
        Double latitude,
        Double longitude,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoInput> videos,
        String robots) {
}
