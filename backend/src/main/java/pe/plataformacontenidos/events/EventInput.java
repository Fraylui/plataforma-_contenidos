package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;

/**
 * Entrada de creación/edición de evento, ya validada en el DTO de API.
 * geographyId, placeId, venueName y endsAt son opcionales. Cada imagen es
 * subida o por enlace externo (ver ContentImageInput); cada URL de
 * youtubeUrls es la pegada por quien redacta (sección 8) — EventService las
 * convierte a Video ID antes de guardar, igual que Article/Place.
 */
public record EventInput(
        String title,
        String excerpt,
        String body,
        UUID categoryId,
        UUID geographyId,
        UUID placeId,
        String venueName,
        Instant startsAt,
        Instant endsAt,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<String> youtubeUrls,
        String robots) {
}
