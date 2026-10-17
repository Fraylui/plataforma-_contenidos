package pe.plataformacontenidos.advertising;

/**
 * Ya hay {@link CampaignService#MAX_COMPETING_CAMPAIGNS} campañas activas
 * compitiendo por el mismo público (misma posición, segmentación que se
 * cruza y fechas que se superponen): una más le quitaría vistas a las que ya
 * pagaron. 409 — se resuelve eligiendo otro tema/zona/fechas o esperando.
 */
public class AdInventoryFullException extends RuntimeException {
    public AdInventoryFullException(String message) {
        super(message);
    }
}
