package pe.plataformacontenidos.content;

public class InvalidYouTubeUrlException extends RuntimeException {
    public InvalidYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
