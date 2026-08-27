package pe.plataformacontenidos.galleries.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.galleries.Gallery;

/** Para listados públicos. Incluye `imageIds` (no solo la portada) para que la tarjeta pueda mostrar el mosaico de miniaturas. */
public record GallerySummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        UUID categoryId,
        UUID geographyId,
        List<UUID> imageIds,
        Instant publishedAt) {

    public static GallerySummaryResponse from(Gallery gallery) {
        return new GallerySummaryResponse(gallery.getId(), gallery.getSlug(), gallery.getTitle(),
                gallery.getExcerpt(), gallery.getCategoryId(), gallery.getGeographyId(), gallery.getImageIds(),
                gallery.getPublishedAt());
    }
}
