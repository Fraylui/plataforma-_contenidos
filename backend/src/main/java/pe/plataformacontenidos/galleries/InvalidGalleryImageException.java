package pe.plataformacontenidos.galleries;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidGalleryImageException extends RuntimeException {
    public InvalidGalleryImageException() {
        super("Cada imagen debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
