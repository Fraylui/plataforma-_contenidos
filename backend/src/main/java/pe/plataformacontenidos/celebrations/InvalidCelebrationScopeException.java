package pe.plataformacontenidos.celebrations;

/** Alcance inválido: país que no es un código de 2 letras, o región sin su país. */
public class InvalidCelebrationScopeException extends RuntimeException {
    public InvalidCelebrationScopeException(String message) {
        super(message);
    }
}
