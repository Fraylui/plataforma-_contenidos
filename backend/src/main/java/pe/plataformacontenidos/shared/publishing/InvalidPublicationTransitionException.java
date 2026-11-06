package pe.plataformacontenidos.shared.publishing;

/** Acción que el estado actual no permite (409). */
public class InvalidPublicationTransitionException extends RuntimeException {

    public InvalidPublicationTransitionException(PublicationStatus current, String action) {
        super("No se puede " + action + ": está " + current.label() + ".");
    }
}
