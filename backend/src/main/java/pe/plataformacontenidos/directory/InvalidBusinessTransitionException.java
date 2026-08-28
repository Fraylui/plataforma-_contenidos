package pe.plataformacontenidos.directory;

public class InvalidBusinessTransitionException extends RuntimeException {
    public InvalidBusinessTransitionException(BusinessStatus from, String action) {
        super("No se puede " + action + " una ficha de directorio en estado " + from);
    }
}
