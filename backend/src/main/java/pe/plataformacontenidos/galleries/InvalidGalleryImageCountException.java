package pe.plataformacontenidos.galleries;

/** Una galería sin fotos no tiene razón de existir — a diferencia de Place/Event, donde las fotos son opcionales. */
public class InvalidGalleryImageCountException extends RuntimeException {
    public InvalidGalleryImageCountException() {
        super("La galería debe tener al menos una fotografía");
    }
}
