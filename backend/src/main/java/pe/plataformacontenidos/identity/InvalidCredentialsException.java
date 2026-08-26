package pe.plataformacontenidos.identity;

/** Mensaje deliberadamente genérico: no revelar si el email existe (OWASP - enumeración de usuarios). */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Credenciales inválidas");
    }
}
