package pe.plataformacontenidos.content;

public class InvalidArticleTransitionException extends RuntimeException {
    public InvalidArticleTransitionException(ArticleStatus from, String action) {
        super("No se puede " + action + " una publicación en estado " + from);
    }
}
