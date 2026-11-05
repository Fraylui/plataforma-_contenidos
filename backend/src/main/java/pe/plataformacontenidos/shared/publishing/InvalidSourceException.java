package pe.plataformacontenidos.shared.publishing;

/** Una fuente que no es un enlace válido, o más de las permitidas. */
public class InvalidSourceException extends RuntimeException {

    public InvalidSourceException(String url) {
        super(url == null
                ? "Hasta " + PostSources.MAX + " fuentes por publicación."
                : "La fuente «" + url + "» no es un enlace válido (debe empezar con https://).");
    }
}
