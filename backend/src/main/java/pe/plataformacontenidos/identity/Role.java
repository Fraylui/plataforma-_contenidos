package pe.plataformacontenidos.identity;

/**
 * Roles RBAC del sistema (CONTEXTO.md sección 13). VISITOR no se modela
 * aquí porque representa "no autenticado", no una fila en la base de datos.
 */
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    EDITOR,
    AUTHOR,
    MODERATOR,
    COLLABORATOR,
    USER
}
