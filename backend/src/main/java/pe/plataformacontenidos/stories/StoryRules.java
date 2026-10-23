package pe.plataformacontenidos.stories;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.shared.YouTubeUrlParser;
import pe.plataformacontenidos.stories.StoryService.StoryItem;

/**
 * Reglas de una historia que no necesitan la base de datos (las que sí —tema
 * activo, foto subida para historias, contenido publicado— las valida
 * StoryService). Los mensajes son para quien publica, en el panel.
 */
final class StoryRules {

    static final Duration LIFETIME = Duration.ofHours(24);
    static final int MAX_BATCH = 10;
    static final int MAX_CAPTION = 140;

    /** Contenido al que una historia puede llevar (un episodio necesita su serie en la URL: para video, el Short). */
    static final Set<ContentType> LINKABLE =
            Set.of(ContentType.PUBLICATION, ContentType.PLACE, ContentType.CELEBRATION, ContentType.GALLERY);

    private StoryRules() {
    }

    static Instant expiryFor(Instant publishedAt) {
        return publishedAt.plus(LIFETIME);
    }

    static void validateBatch(List<StoryItem> items) {
        if (items == null || items.isEmpty()) {
            throw new InvalidStoryException("Agrega al menos una historia.");
        }
        if (items.size() > MAX_BATCH) {
            throw new InvalidStoryException("Puedes publicar hasta " + MAX_BATCH + " historias a la vez.");
        }
        items.forEach(StoryRules::validateItem);
    }

    static void validateItem(StoryItem item) {
        if ((item.imageId() == null) == (item.background() == null)) {
            throw new InvalidStoryException("Cada historia lleva una foto o un fondo de color.");
        }
        String caption = caption(item);
        if (caption != null && caption.length() > MAX_CAPTION) {
            throw new InvalidStoryException("El texto puede tener hasta " + MAX_CAPTION + " caracteres.");
        }
        if (item.imageId() == null && caption == null) {
            throw new InvalidStoryException("Una historia de solo color necesita un texto.");
        }
        if ((item.linkType() == null) != (item.linkId() == null)) {
            throw new InvalidStoryException("Elige a qué contenido lleva la historia.");
        }
        if (item.linkType() != null && !LINKABLE.contains(item.linkType())) {
            throw new InvalidStoryException("Una historia puede llevar a una publicación, un lugar, una celebración o una galería.");
        }
        if (item.linkType() != null && isPresent(item.youtubeUrl())) {
            throw new InvalidStoryException("Elige un enlace: un contenido del sitio o un video de YouTube, no los dos.");
        }
        if (isPresent(item.youtubeUrl()) && youtubeVideoId(item) == null) {
            throw new InvalidStoryException("Pega el link de un video de YouTube.");
        }
    }

    /** Texto sin espacios de más; null si quedó vacío. */
    static String caption(StoryItem item) {
        return isPresent(item.caption()) ? item.caption().strip() : null;
    }

    static String youtubeVideoId(StoryItem item) {
        return isPresent(item.youtubeUrl()) ? YouTubeUrlParser.extractVideoId(item.youtubeUrl().strip()).orElse(null) : null;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
