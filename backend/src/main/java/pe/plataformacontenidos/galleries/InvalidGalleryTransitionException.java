package pe.plataformacontenidos.galleries;

public class InvalidGalleryTransitionException extends RuntimeException {
    public InvalidGalleryTransitionException(GalleryStatus from, String action) {
        super("No se puede " + action + " una galería en estado " + from);
    }
}
