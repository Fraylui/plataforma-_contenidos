package pe.plataformacontenidos.events;

/** La fecha de fin del evento es anterior a la fecha de inicio. */
public class InvalidEventDateRangeException extends RuntimeException {
    public InvalidEventDateRangeException() {
        super("La fecha de fin no puede ser anterior a la fecha de inicio");
    }
}
