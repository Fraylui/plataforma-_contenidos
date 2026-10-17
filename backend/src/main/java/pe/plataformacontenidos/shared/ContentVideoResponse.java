package pe.plataformacontenidos.shared;

/** Espejo de ContentVideo para la API. */
public record ContentVideoResponse(String videoId, String title, String caption, boolean vertical) {

    public static ContentVideoResponse from(ContentVideo video) {
        return new ContentVideoResponse(video.getVideoId(), video.getTitle(), video.getCaption(), video.isVertical());
    }
}
