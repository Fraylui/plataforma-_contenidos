package pe.plataformacontenidos.galleries;

/** Quien solo crea intentó operar sobre una galería que no le pertenece. */
public class GalleryAccessDeniedException extends RuntimeException {
    public GalleryAccessDeniedException() {
        super("No tienes permiso sobre esta galería");
    }
}
