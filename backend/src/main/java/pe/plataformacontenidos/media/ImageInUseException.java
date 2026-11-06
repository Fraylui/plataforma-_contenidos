package pe.plataformacontenidos.media;

/** Borrar una imagen en uso la dejaría rota en el sitio público (ver ImageUsages). */
public class ImageInUseException extends RuntimeException {
    public ImageInUseException(long usages) {
        super("No se puede eliminar: la imagen se usa en " + usages + (usages == 1 ? " lugar" : " lugares")
                + " (contenido, publicidad o la configuración del sitio). Quítala de ahí primero.");
    }
}
