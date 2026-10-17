package pe.plataformacontenidos.series;

public class EpisodeNotFoundException extends RuntimeException {

    public EpisodeNotFoundException(Object idOrSlug) {
        super("Episodio no encontrado: " + idOrSlug);
    }
}
