package pe.plataformacontenidos.stories;

public class StoryNotFoundException extends RuntimeException {

    public StoryNotFoundException(Object id) {
        super("Historia no encontrada: " + id);
    }
}
