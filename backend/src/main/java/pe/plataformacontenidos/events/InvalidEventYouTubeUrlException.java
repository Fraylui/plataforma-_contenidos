package pe.plataformacontenidos.events;

public class InvalidEventYouTubeUrlException extends RuntimeException {
    public InvalidEventYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
