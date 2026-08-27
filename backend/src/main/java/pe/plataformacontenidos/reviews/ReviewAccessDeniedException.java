package pe.plataformacontenidos.reviews;

/** Un AUTHOR intentó operar sobre una reseña que no le pertenece. */
public class ReviewAccessDeniedException extends RuntimeException {
    public ReviewAccessDeniedException() {
        super("No tienes permiso sobre esta reseña");
    }
}
