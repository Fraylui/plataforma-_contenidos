package pe.plataformacontenidos.identity.permission;

public class ModuleAccessDeniedException extends RuntimeException {

    public ModuleAccessDeniedException() {
        super("No tienes acceso a esta sección del panel.");
    }
}
