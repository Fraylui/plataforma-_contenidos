package pe.plataformacontenidos.directory;

/** Un AUTHOR intentó operar sobre una ficha de directorio que no le pertenece. */
public class BusinessAccessDeniedException extends RuntimeException {
    public BusinessAccessDeniedException() {
        super("No tienes permiso sobre esta ficha de directorio");
    }
}
