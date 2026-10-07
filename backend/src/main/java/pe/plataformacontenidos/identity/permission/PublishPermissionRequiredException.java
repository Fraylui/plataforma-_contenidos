package pe.plataformacontenidos.identity.permission;

public class PublishPermissionRequiredException extends RuntimeException {

    public PublishPermissionRequiredException() {
        super("Necesitas permiso de publicar en esta sección para hacer esto.");
    }
}
