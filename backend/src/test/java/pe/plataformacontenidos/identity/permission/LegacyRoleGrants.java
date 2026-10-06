package pe.plataformacontenidos.identity.permission;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;

/**
 * Para los tests anteriores a los permisos por módulo: da a un usuario de
 * prueba lo mismo que V49 dio a las cuentas existentes según su rol
 * (ADMIN → Publicador + Publicidad, EDITOR → Publicador, AUTHOR → Creador).
 */
public final class LegacyRoleGrants {

    private LegacyRoleGrants() {
    }

    public static void grant(WorkerPermissionRepository repository, UUID userId, Role role) {
        Map<Module, AccessLevel> levels = new EnumMap<>(Module.class);
        switch (role.name()) {
            case "ADMIN" -> {
                levels.putAll(Templates.of("PUBLICADOR"));
                levels.put(Module.ADVERTISING, AccessLevel.ACCESS);
            }
            case "EDITOR" -> levels.putAll(Templates.of("PUBLICADOR"));
            case "AUTHOR" -> levels.putAll(Templates.of("CREADOR"));
            default -> {
                // Dueño: no necesita filas. Otros roles: sin acceso.
            }
        }
        levels.forEach((module, level) -> repository.save(new WorkerPermission(userId, module, level)));
    }
}
