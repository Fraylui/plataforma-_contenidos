package pe.plataformacontenidos.advertising;

/** Una campaña referenció un placementKey que no existe en el catálogo de AdPlacement. */
public class AdPlacementKeyNotFoundException extends RuntimeException {
    public AdPlacementKeyNotFoundException(String key) {
        super("Posición de anuncio no encontrada: " + key);
    }
}
