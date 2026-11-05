package pe.plataformacontenidos.content;

/** Una publicación necesita algo que mostrar: fotos, un video o texto (como un post de red social). */
public class EmptyPublicationException extends RuntimeException {
    public EmptyPublicationException() {
        super("Agrega fotos, un video o un texto.");
    }
}
