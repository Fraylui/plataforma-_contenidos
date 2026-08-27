package pe.plataformacontenidos.events;

/** Un AUTHOR intentó operar sobre un evento que no le pertenece. */
public class EventAccessDeniedException extends RuntimeException {
    public EventAccessDeniedException() {
        super("No tienes permiso sobre este evento");
    }
}
