package pe.plataformacontenidos.dashboard;

public class InvalidDashboardRangeException extends RuntimeException {

    public InvalidDashboardRangeException(int rangeDays) {
        super("Período inválido: " + rangeDays + " días (usa 7, 30 o 90).");
    }
}
