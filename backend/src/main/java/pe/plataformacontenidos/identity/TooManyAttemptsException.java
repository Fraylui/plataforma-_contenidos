package pe.plataformacontenidos.identity;

public class TooManyAttemptsException extends RuntimeException {
    public TooManyAttemptsException() {
        super("Demasiados intentos, inténtalo más tarde");
    }
}
