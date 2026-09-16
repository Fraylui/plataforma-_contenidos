package pe.plataformacontenidos.directory;

import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

/**
 * Entrada de creación/edición de ficha de directorio, ya validada en el
 * DTO de API. placeId, address, phone, email, website, coordenadas,
 * images y videos son opcionales. Cada imagen es subida o por enlace
 * externo (ver ContentImageInput); cada video trae la URL pegada por quien
 * redacta (sección 8) — BusinessService la convierte a Video ID antes de
 * guardar, igual que Place.
 */
public record BusinessInput(
        String name,
        String excerpt,
        String body,
        UUID categoryId,
        BusinessType businessType,
        UUID placeId,
        String address,
        String phone,
        String email,
        String website,
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
