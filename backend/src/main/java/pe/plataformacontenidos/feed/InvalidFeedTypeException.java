package pe.plataformacontenidos.feed;

import pe.plataformacontenidos.engagement.ContentType;

/** Se pidió una pestaña del feed con un tipo que el feed no incluye (ver FeedService.FEED_TYPES). */
public class InvalidFeedTypeException extends RuntimeException {
    public InvalidFeedTypeException(ContentType type) {
        super("El feed solo incluye ARTICLE, PLACE y EVENT (se pidió " + type + ")");
    }
}
