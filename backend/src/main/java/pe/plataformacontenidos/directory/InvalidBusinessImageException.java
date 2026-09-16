package pe.plataformacontenidos.directory;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidBusinessImageException extends RuntimeException {
    public InvalidBusinessImageException() {
        super("Cada imagen debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
