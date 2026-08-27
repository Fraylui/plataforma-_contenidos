package pe.plataformacontenidos.events;

public class InvalidEventTransitionException extends RuntimeException {
    public InvalidEventTransitionException(EventStatus from, String action) {
        super("No se puede " + action + " un evento en estado " + from);
    }
}
