package pe.plataformacontenidos.reviews;

public class InvalidReviewYouTubeUrlException extends RuntimeException {
    public InvalidReviewYouTubeUrlException(String url) {
        super("No se reconoce como una URL de YouTube válida: " + url);
    }
}
