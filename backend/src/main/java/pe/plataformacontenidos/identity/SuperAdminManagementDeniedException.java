package pe.plataformacontenidos.identity;

/**
 * CONTEXTO.md sección 36.4: ADMIN tiene "gestión operativa completa, sin
 * acceso ... a la gestión de SUPER_ADMIN". Un ADMIN no puede crear ni
 * activar/desactivar cuentas SUPER_ADMIN — solo otro SUPER_ADMIN puede.
 */
public class SuperAdminManagementDeniedException extends RuntimeException {
    public SuperAdminManagementDeniedException() {
        super("Solo un SUPER_ADMIN puede gestionar cuentas SUPER_ADMIN");
    }
}
