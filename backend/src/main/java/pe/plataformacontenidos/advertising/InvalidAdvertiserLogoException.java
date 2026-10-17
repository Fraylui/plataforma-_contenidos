package pe.plataformacontenidos.advertising;

public class InvalidAdvertiserLogoException extends RuntimeException {

    public InvalidAdvertiserLogoException() {
        super("El logo ya no existe en la biblioteca de imágenes.");
    }
}
