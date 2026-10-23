package pe.plataformacontenidos.identity.permission;

import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.internal.WorkerPermission;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;

/**
 * Trabajadores de prueba con los mismos permisos que las cuentas reales:
 * las plantillas del panel (Publicador), solo los módulos de contenido o sin
 * permisos. Todos los que tienen un módulo de contenido publican directo (V54).
 * El dueño no está acá: hay uno solo (V66) y se usa con TestOwner.
 */
public enum TestProfile {
    PUBLICADOR_CON_PUBLICIDAD,
    PUBLICADOR,
    SOLO_CONTENIDO,
    SIN_PERMISOS;

    public Role toRole() {
        return Role.WORKER;
    }

    public void grant(WorkerPermissionRepository repository, UUID userId) {
        Map<Module, AccessLevel> levels = new EnumMap<>(Module.class);
        switch (this) {
            case PUBLICADOR_CON_PUBLICIDAD -> {
                levels.putAll(Templates.of("PUBLICADOR"));
                levels.put(Module.ADVERTISING, AccessLevel.ACCESS);
            }
            case PUBLICADOR -> levels.putAll(Templates.of("PUBLICADOR"));
            case SOLO_CONTENIDO -> {
                for (Module module : Module.values()) {
                    if (module.isContent()) {
                        levels.put(module, AccessLevel.PUBLISH);
                    }
                }
            }
            default -> {
                // Sin permisos: ninguna fila.
            }
        }
        levels.forEach((module, level) -> repository.save(new WorkerPermission(userId, module, level)));
    }
}
