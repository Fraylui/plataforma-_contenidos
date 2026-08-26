package pe.plataformacontenidos.media;

/** Archivo no es una imagen válida/soportada, o excede los límites configurados. */
public class InvalidImageException extends RuntimeException {
    public InvalidImageException(String message) {
        super(message);
    }
}
