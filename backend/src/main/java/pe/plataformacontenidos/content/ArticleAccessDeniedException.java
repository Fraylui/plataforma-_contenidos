package pe.plataformacontenidos.content;

/** Quien solo crea intentó operar sobre una publicación que no le pertenece. */
public class ArticleAccessDeniedException extends RuntimeException {
    public ArticleAccessDeniedException() {
        super("No tienes permiso sobre esta publicación");
    }
}
