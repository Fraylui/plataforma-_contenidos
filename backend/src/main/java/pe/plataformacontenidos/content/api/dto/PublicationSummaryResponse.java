package pe.plataformacontenidos.content.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.content.PublicationType;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Para listados públicos: sin el body completo (rendimiento — CONTEXTO.md
 * 43). coverImageId/coverImageUrl son excluyentes (ver ContentImage): la
 * primera imagen de la publicación, subida o por enlace externo.
 */
public record PublicationSummaryResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        PublicationType publicationType,
        UUID categoryId,
        UUID coverImageId,
        String coverImageUrl,
        boolean hasVideo,
        Instant publishedAt,
        long likeCount) {

    public static PublicationSummaryResponse from(Publication publication, long likeCount) {
        ContentImage cover = publication.getCoverImage();
        return new PublicationSummaryResponse(publication.getId(), publication.getSlug(), publication.getTitle(),
                publication.getExcerpt(), publication.getPublicationType(), publication.getCategoryId(),
                cover == null ? null : cover.getImageId(), cover == null ? null : cover.getExternalUrl(),
                !publication.getVideos().isEmpty(), publication.getPublishedAt(), likeCount);
    }
}
