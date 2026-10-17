package pe.plataformacontenidos.shared;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Un video de YouTube embebido en un contenido: solo la referencia (Video
 * ID), nunca el video en sí (sección 8). Título y pie de foto opcionales —
 * el título se autorrellena al pegar el link vía oEmbed de YouTube, editable
 * a mano.
 */
@Embeddable
public class ContentVideo {

    @Column(name = "video_id")
    private String videoId;

    @Column(name = "title")
    private String title;

    @Column(name = "caption")
    private String caption;

    /** Short de YouTube (9:16): el detalle lo muestra vertical. */
    @Column(name = "vertical", nullable = false)
    private boolean vertical;

    protected ContentVideo() {
        // JPA
    }

    public ContentVideo(String videoId, String title, String caption, boolean vertical) {
        this.videoId = videoId;
        this.title = title;
        this.caption = caption;
        this.vertical = vertical;
    }

    public String getVideoId() {
        return videoId;
    }

    public String getTitle() {
        return title;
    }

    public String getCaption() {
        return caption;
    }

    public boolean isVertical() {
        return vertical;
    }
}
