package pe.plataformacontenidos.live;

/** Paso que no corresponde al estado de la transmisión (terminar algo que no está en vivo, dos en vivo a la vez…). */
public class InvalidLiveStreamException extends RuntimeException {

    public InvalidLiveStreamException(String message) {
        super(message);
    }
}
