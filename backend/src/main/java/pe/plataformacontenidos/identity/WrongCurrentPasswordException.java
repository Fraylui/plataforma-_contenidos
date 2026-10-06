package pe.plataformacontenidos.identity;

public class WrongCurrentPasswordException extends RuntimeException {

    public WrongCurrentPasswordException() {
        super("La contraseña actual no es correcta.");
    }
}
