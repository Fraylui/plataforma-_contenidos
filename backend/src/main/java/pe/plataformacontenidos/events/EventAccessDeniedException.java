package pe.plataformacontenidos.events;

/** Quien solo crea intentó operar sobre un evento que no le pertenece. */
public class EventAccessDeniedException extends RuntimeException {
    public EventAccessDeniedException() {
        super("No tienes permiso sobre este evento");
    }
}
