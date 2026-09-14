package pe.plataformacontenidos.shared;

import java.util.UUID;

/** Espejo de ContentImage para la API: exactamente uno de los dos campos viene con valor. */
public record ContentImageResponse(UUID imageId, String externalUrl, String title, String caption) {

    public static ContentImageResponse from(ContentImage image) {
        return new ContentImageResponse(image.getImageId(), image.getExternalUrl(), image.getTitle(),
                image.getCaption());
    }
}
