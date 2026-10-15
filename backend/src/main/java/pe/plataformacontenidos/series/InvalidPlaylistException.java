package pe.plataformacontenidos.series;

/** Link de lista de YouTube no reconocido, ya conectado a otra serie, o video no válido. */
public class InvalidPlaylistException extends RuntimeException {

    public InvalidPlaylistException(String message) {
        super(message);
    }
}
