package pe.plataformacontenidos.places;

/** Un AUTHOR intentó operar sobre un lugar que no le pertenece. */
public class PlaceAccessDeniedException extends RuntimeException {
    public PlaceAccessDeniedException() {
        super("No tienes permiso sobre este lugar");
    }
}
