package pe.plataformacontenidos.celebrations;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidCelebrationImageException extends RuntimeException {
    public InvalidCelebrationImageException() {
        super("Cada imagen debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
