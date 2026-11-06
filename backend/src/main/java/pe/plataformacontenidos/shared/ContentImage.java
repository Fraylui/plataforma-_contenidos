package pe.plataformacontenidos.shared;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.UUID;

/**
 * Una imagen de contenido: o bien una imagen subida (imageId, módulo
 * Media) o bien un enlace externo (externalUrl) — nunca ambas ni ninguna.
 * Publication/Place/Celebration comparten esto (CONTEXTO.md sección 3): antes cada
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

    @Column(name = "title")
    private String title;

    @Column(name = "caption")
    private String caption;

    /** Autor de la foto si no es del dueño (null = foto propia). */
    @Column(name = "credit")
    private String credit;

    /** Con crédito: se confirmó permiso por escrito o licencia libre (D.Leg. 822 art. 39). */
    @Column(name = "rights_confirmed")
    private Boolean rightsConfirmed;

    protected ContentImage() {
        // JPA
    }

    private ContentImage(UUID imageId, String externalUrl, String title, String caption) {
        this.imageId = imageId;
        this.externalUrl = externalUrl;
        this.title = title;
        this.caption = caption;
    }

    /** La misma foto con su crédito (ver ContentImageInput.validCredit). */
    public ContentImage withCredit(String credit, boolean rightsConfirmed) {
        ContentImage copy = new ContentImage(imageId, externalUrl, title, caption);
        copy.credit = credit;
        copy.rightsConfirmed = credit == null ? null : rightsConfirmed;
        return copy;
    }

    public static ContentImage uploaded(UUID imageId, String title, String caption) {
        return new ContentImage(imageId, null, title, caption);
    }

    public static ContentImage external(String url, String title, String caption) {
        return new ContentImage(null, url, title, caption);
    }

    public UUID getImageId() {
        return imageId;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public String getTitle() {
        return title;
    }

    public String getCaption() {
        return caption;
    }

    public String getCredit() {
        return credit;
    }

    public boolean isRightsConfirmed() {
        return Boolean.TRUE.equals(rightsConfirmed);
    }
}
