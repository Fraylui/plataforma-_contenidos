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
        return granted == needed;
    }

    /** Imágenes: editar o borrar las de otros exige algún módulo de contenido. */
    public boolean hasAnyContentModule() {
        for (Module module : Module.values()) {
            if (module.isContent() && can(module, AccessLevel.PUBLISH)) {
                return true;
            }
        }
        return false;
    }
}
