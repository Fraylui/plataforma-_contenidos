package pe.plataformacontenidos.identity.permission;

import java.util.Map;
import java.util.UUID;

/**
 * Lo que puede hacer un usuario, leído de la base en cada petición
 * (revocación inmediata). El dueño no tiene filas: puede todo.
 */
public record Permissions(UUID userId, boolean owner, boolean active, boolean mustChangePassword,
        Map<Module, AccessLevel> levels) {

    public Permissions {
        levels = Map.copyOf(levels);
    }

    public boolean can(Module module, AccessLevel needed) {
        if (!active) {
            return false;
        }
        if (owner) {
            return true;
        }
        AccessLevel granted = levels.get(module);
        if (granted == null) {
            return false;
        }
        return granted == needed || (granted == AccessLevel.PUBLISH && needed == AccessLevel.CREATE);
    }

    public boolean canPublish(Module module) {
        return can(module, AccessLevel.PUBLISH);
    }
}
