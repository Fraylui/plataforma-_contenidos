package pe.plataformacontenidos.directory;

public class InvalidBusinessYouTubeUrlException extends RuntimeException {
    public InvalidBusinessYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
