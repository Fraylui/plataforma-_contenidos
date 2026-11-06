package pe.plataformacontenidos.identity.permission;

public class InvalidPermissionException extends RuntimeException {

    public InvalidPermissionException(Module module, AccessLevel level) {
        super(module.isContent()
                ? "En " + module + " el nivel debe ser Crear o Publicar (recibido: " + level + ")."
                : "En " + module + " el nivel debe ser Acceso (recibido: " + level + ").");
    }
}
