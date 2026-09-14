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

    protected ContentVideo() {
        // JPA
    }

    public ContentVideo(String videoId, String title, String caption) {
        this.videoId = videoId;
        this.title = title;
        this.caption = caption;
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
}
