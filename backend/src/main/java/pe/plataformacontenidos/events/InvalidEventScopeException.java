package pe.plataformacontenidos.events;

/** Alcance inválido: país que no es un código de 2 letras, o región sin su país. */
public class InvalidEventScopeException extends RuntimeException {
    public InvalidEventScopeException(String message) {
        super(message);
    }
}
