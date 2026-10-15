package pe.plataformacontenidos.identity.permission;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;

/**
 * Perfiles de prueba con los mismos permisos que las cuentas reales de la
 * plataforma: el dueño (sin filas, puede todo) y trabajadores con las
 * plantillas del panel (Publicador), solo los 5 módulos de contenido o sin
 * permisos. Todos los que tienen un módulo de contenido publican directo (V54).
 */
public enum TestProfile {
    DUENO,
    PUBLICADOR_CON_PUBLICIDAD,
    PUBLICADOR,
    SOLO_CONTENIDO,
    SIN_PERMISOS;

    public Role toRole() {
        return this == DUENO ? Role.OWNER : Role.WORKER;
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
                // Dueño: no necesita filas. Sin permisos: ninguna.
            }
        }
        levels.forEach((module, level) -> repository.save(new WorkerPermission(userId, module, level)));
    }
}
