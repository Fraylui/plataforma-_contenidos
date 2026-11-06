package pe.plataformacontenidos.series;

/** YouTube no respondió o respondió algo inesperado; el mensaje se muestra en el panel. */
public class PlaylistFeedException extends RuntimeException {

    public PlaylistFeedException(String message) {
        super(message);
    }
}
