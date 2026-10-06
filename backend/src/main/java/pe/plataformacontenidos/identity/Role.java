package pe.plataformacontenidos.identity;

/**
 * Roles del panel (spec 2a, V50): el dueño puede todo; un trabajador puede
 * lo que digan sus permisos por módulo (identity.worker_permissions).
 */
public enum Role {
    OWNER,
    WORKER
}
