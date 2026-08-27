package pe.plataformacontenidos.galleries;

/** Un AUTHOR intentó operar sobre una galería que no le pertenece. */
public class GalleryAccessDeniedException extends RuntimeException {
    public GalleryAccessDeniedException() {
        super("No tienes permiso sobre esta galería");
    }
}
