package pe.plataformacontenidos.series;

public class SeriesNotFoundException extends RuntimeException {

    public SeriesNotFoundException(Object idOrSlug) {
        super("Serie no encontrada: " + idOrSlug);
    }
}
