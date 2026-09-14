package pe.plataformacontenidos.advertising;

public class DuplicateAdPlacementKeyException extends RuntimeException {
    public DuplicateAdPlacementKeyException(String key) {
        super("Ya existe una posición de anuncio con la clave \"" + key + "\"");
    }
}
