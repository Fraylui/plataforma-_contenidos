package pe.plataformacontenidos.live;

/** Dato de entrada no válido para una transmisión: link que no es de YouTube o serie inexistente. */
public class InvalidLiveInputException extends RuntimeException {

    public InvalidLiveInputException(String message) {
        super(message);
    }
}
