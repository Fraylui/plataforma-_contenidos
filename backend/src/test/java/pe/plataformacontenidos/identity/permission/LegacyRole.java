package pe.plataformacontenidos.identity.permission;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;

/**
 * Perfiles de prueba de los tests anteriores a 2a: cada rol viejo se
 * traduce a dueño o trabajador con el mismo alcance que V49/V50 dieron a
 * las cuentas reales (ADMIN → Publicador + Publicidad, EDITOR → Publicador,
 * AUTHOR → Creador, otros → sin permisos).
 */
public enum LegacyRole {
    SUPER_ADMIN,
    ADMIN,
    EDITOR,
    AUTHOR,
    MODERATOR,
    COLLABORATOR,
    USER;

    public Role toRole() {
        return this == SUPER_ADMIN ? Role.OWNER : Role.WORKER;
    }

    public void grant(WorkerPermissionRepository repository, UUID userId) {
        Map<Module, AccessLevel> levels = new EnumMap<>(Module.class);
        switch (this) {
            case ADMIN -> {
                levels.putAll(Templates.of("PUBLICADOR"));
                levels.put(Module.ADVERTISING, AccessLevel.ACCESS);
            }
            case EDITOR -> levels.putAll(Templates.of("PUBLICADOR"));
            case AUTHOR -> levels.putAll(Templates.of("CREADOR"));
            default -> {
                // Dueño: no necesita filas. Otros: sin acceso.
            }
        }
        levels.forEach((module, level) -> repository.save(new WorkerPermission(userId, module, level)));
    }
}
