package pe.plataformacontenidos.live;

public class LiveStreamNotFoundException extends RuntimeException {

    public LiveStreamNotFoundException(Object idOrSlug) {
        super("Transmisión no encontrada: " + idOrSlug);
    }
}
