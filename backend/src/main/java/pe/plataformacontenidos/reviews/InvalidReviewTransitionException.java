package pe.plataformacontenidos.reviews;

public class InvalidReviewTransitionException extends RuntimeException {
    public InvalidReviewTransitionException(ReviewStatus from, String action) {
        super("No se puede " + action + " una reseña en estado " + from);
    }
}
