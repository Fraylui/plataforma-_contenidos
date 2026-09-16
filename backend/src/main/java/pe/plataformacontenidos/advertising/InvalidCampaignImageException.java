package pe.plataformacontenidos.advertising;

/** Ni imageId ni externalUrl (o ambos), o externalUrl con forma inválida — ver ContentImageInput. */
public class InvalidCampaignImageException extends RuntimeException {
    public InvalidCampaignImageException() {
        super("La creatividad debe tener exactamente una fuente: una imagen subida o un enlace externo http(s) válido.");
    }
}
