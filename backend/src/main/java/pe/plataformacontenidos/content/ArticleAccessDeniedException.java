package pe.plataformacontenidos.content;

/** Un AUTHOR intentó operar sobre un artículo que no le pertenece. */
public class ArticleAccessDeniedException extends RuntimeException {
    public ArticleAccessDeniedException() {
        super("No tienes permiso sobre este artículo");
    }
}
