package pe.plataformacontenidos.shared.publishing;

/** Fecha de programación inválida (400). */
public class InvalidScheduleException extends RuntimeException {

    public InvalidScheduleException(String message) {
        super(message);
    }
}
