package pe.plataformacontenidos.media;

public class TooManyUploadsException extends RuntimeException {
    public TooManyUploadsException() {
        super("Demasiadas subidas, inténtalo más tarde");
    }
}
