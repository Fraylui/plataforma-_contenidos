package pe.plataformacontenidos.places;

public class InvalidPlaceTransitionException extends RuntimeException {
    public InvalidPlaceTransitionException(PlaceStatus from, String action) {
        super("No se puede " + action + " un lugar en estado " + from);
    }
}
