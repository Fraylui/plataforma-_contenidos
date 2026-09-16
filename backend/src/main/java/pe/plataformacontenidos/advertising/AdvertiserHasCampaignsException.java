package pe.plataformacontenidos.advertising;

import java.util.UUID;

/** Borrar un anunciante con campañas dejaría campañas huérfanas (sin nadie a quién facturarle/mostrarle métricas). */
public class AdvertiserHasCampaignsException extends RuntimeException {
    public AdvertiserHasCampaignsException(UUID advertiserId) {
        super("No se puede eliminar el anunciante " + advertiserId
                + ": tiene campañas asociadas. Elimínalas primero.");
    }
}
