package pe.plataformacontenidos.content;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidPublicationImageException extends RuntimeException {
    public InvalidPublicationImageException() {
        super("Cada imagen debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
