package pe.plataformacontenidos.advertising;

/** El dueño no confirmó que el anuncio muestra las condiciones de la oferta (D.L. 1044, art. 17.3.f). */
public class CampaignComplianceRequiredException extends RuntimeException {
    public CampaignComplianceRequiredException() {
        super("Confirma que el anuncio muestra la vigencia, el stock y las condiciones de la oferta, "
                + "y la advertencia obligatoria de su rubro si la tiene.");
    }
}
