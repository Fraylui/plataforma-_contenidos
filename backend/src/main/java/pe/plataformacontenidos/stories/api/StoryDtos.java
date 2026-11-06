package pe.plataformacontenidos.stories.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.stories.Story;
import pe.plataformacontenidos.stories.StoryService.StoryItem;

/** Formas JSON de Historias (las tipa frontend/src/lib/api/types.ts). */
public final class StoryDtos {

    private StoryDtos() {
    }

    public record TopicRef(UUID id, String name, String slug) {
    }

    /** A dónde lleva el botón: {@code label} es el texto del botón («Ver publicación»). */
    public record LinkView(ContentType type, String slug, String title, String label) {
    }

    public record StoryView(UUID id, UUID imageId, Story.Background background, String caption,
            Story.CaptionPosition captionPosition, LinkView link, String youtubeVideoId, Instant publishedAt,
            Instant expiresAt, boolean highlighted, long likeCount) {
    }

    /** Un tema de la fila del Inicio con sus historias en orden de reproducción. */
    public record ActiveTopic(TopicRef category, Instant latestAt, List<StoryView> stories) {
    }

    public record StoryDetail(StoryView story, TopicRef category) {
    }

    /** Lo del visitante más lo que solo ve el panel. */
    public record AdminStory(UUID id, UUID imageId, Story.Background background, String caption,
            Story.CaptionPosition captionPosition, LinkView link, String youtubeVideoId, Instant publishedAt,
            Instant expiresAt, boolean highlighted, long likeCount, UUID categoryId, String categoryName, long views,
            int ctaClicks, ContentType linkContentType, UUID linkContentId) {
    }

    public record StoryItemRequest(UUID imageId, Story.Background background, String caption,
            Story.CaptionPosition captionPosition, ContentType linkType, UUID linkId, String youtubeUrl,
            Boolean highlighted) {

        /** {@code highlighted} es objeto: si no viene en el JSON, no es Destacada (Jackson 3 rechaza un primitivo ausente). */
        public StoryItem toItem() {
            return new StoryItem(imageId, background, caption, captionPosition, linkType, linkId, youtubeUrl,
                    Boolean.TRUE.equals(highlighted));
        }
    }

    public record CreateStoriesRequest(@NotNull UUID categoryId, @NotNull @Valid List<StoryItemRequest> items) {
    }

    public record HighlightRequest(boolean highlighted) {
    }
}
