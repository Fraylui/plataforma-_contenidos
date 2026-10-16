package pe.plataformacontenidos.celebrations;

public class InvalidCelebrationYouTubeUrlException extends RuntimeException {
    public InvalidCelebrationYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
