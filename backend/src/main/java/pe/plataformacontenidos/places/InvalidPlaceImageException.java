package pe.plataformacontenidos.places;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidPlaceImageException extends RuntimeException {
    public InvalidPlaceImageException() {
        super("Cada imagen debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
