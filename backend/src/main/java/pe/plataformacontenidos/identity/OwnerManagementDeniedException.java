package pe.plataformacontenidos.identity;

/** La cuenta del dueño no se puede desactivar, degradar ni restablecer desde el panel (spec 2a §3.1). */
public class OwnerManagementDeniedException extends RuntimeException {

    public OwnerManagementDeniedException() {
        super("La cuenta del dueño no se puede modificar desde aquí.");
    }
}
