package pe.plataformacontenidos.places;

public class InvalidPlaceYouTubeUrlException extends RuntimeException {
    public InvalidPlaceYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
