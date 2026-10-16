package pe.plataformacontenidos.events;

/** Fechas de una celebración inválidas: fin antes del inicio, o «desde el año» en una fecha que no se repite. */
public class InvalidEventDateRangeException extends RuntimeException {
    public InvalidEventDateRangeException() {
        super("La fecha de fin no puede ser anterior a la fecha de inicio");
    }

    public InvalidEventDateRangeException(String message) {
        super(message);
    }
}
