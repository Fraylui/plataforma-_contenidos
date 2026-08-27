package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Entrada de creación/edición de evento, ya validada en el DTO de API.
 * geographyId, placeId, venueName, endsAt, imageIds y youtubeUrl son
 * opcionales. youtubeUrl es la URL pegada por el redactor (sección 8);
 * EventService la convierte al Video ID antes de guardar, igual que
 * Article/Place.
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
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {
}
