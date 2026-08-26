package pe.plataformacontenidos.media;

public class ImageAccessDeniedException extends RuntimeException {
    public ImageAccessDeniedException() {
        super("No tienes permiso sobre esta imagen");
    }
}
