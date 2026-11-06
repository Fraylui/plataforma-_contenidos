package pe.plataformacontenidos.shared.publishing;

/** Un post sin fotos, sin video y sin texto (ver PostBody). */
public class EmptyPostException extends RuntimeException {

    public EmptyPostException() {
        super("Agrega fotos, un video o un texto.");
    }
}
