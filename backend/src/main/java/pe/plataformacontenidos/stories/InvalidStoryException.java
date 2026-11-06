package pe.plataformacontenidos.stories;

/** Historia que no se puede guardar así: el mensaje dice qué corregir. */
public class InvalidStoryException extends RuntimeException {

    public InvalidStoryException(String message) {
        super(message);
    }
}
