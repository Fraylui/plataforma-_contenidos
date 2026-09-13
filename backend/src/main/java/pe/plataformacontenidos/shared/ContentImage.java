package pe.plataformacontenidos.shared;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.UUID;

/**
 * Una imagen de contenido: o bien una imagen subida (imageId, módulo
 * Media) o bien un enlace externo (externalUrl) — nunca ambas ni ninguna.
 * Article/Place/Event comparten esto (CONTEXTO.md sección 3): antes cada
 * uno guardaba solo UUID de imágenes subidas; ahora una publicación puede
 * tener imágenes subidas, por enlace, o una mezcla, según lo que tenga a
 * mano quien la redacta.
 */
@Embeddable
public class ContentImage {

    @Column(name = "image_id")
    private UUID imageId;

    @Column(name = "external_url")
    private String externalUrl;

    protected ContentImage() {
        // JPA
    }

    private ContentImage(UUID imageId, String externalUrl) {
        this.imageId = imageId;
        this.externalUrl = externalUrl;
    }

    public static ContentImage uploaded(UUID imageId) {
        return new ContentImage(imageId, null);
    }

    public static ContentImage external(String url) {
        return new ContentImage(null, url);
    }

    public UUID getImageId() {
        return imageId;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public boolean isUploaded() {
        return imageId != null;
    }
}
