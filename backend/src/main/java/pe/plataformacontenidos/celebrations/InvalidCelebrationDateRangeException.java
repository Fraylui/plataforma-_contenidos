package pe.plataformacontenidos.celebrations;

/** Fechas de una celebración inválidas: fin antes del inicio, o «desde el año» en una fecha que no se repite. */
public class InvalidCelebrationDateRangeException extends RuntimeException {
    public InvalidCelebrationDateRangeException() {
        super("La fecha de fin no puede ser anterior a la fecha de inicio");
    }

    public InvalidCelebrationDateRangeException(String message) {
        super(message);
    }
}
