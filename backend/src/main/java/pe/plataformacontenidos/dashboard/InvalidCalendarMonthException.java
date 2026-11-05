package pe.plataformacontenidos.dashboard;

public class InvalidCalendarMonthException extends RuntimeException {

    public InvalidCalendarMonthException(String month) {
        super("Mes inválido: " + month + " (usa el formato AAAA-MM).");
    }
}
