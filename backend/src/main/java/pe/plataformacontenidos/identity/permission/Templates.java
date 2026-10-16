package pe.plataformacontenidos.identity.permission;

import static pe.plataformacontenidos.identity.permission.AccessLevel.ACCESS;
import static pe.plataformacontenidos.identity.permission.AccessLevel.PUBLISH;
import static pe.plataformacontenidos.identity.permission.Module.*;

import java.util.Map;

/**
 * Plantillas de trabajador (spec 2a §3.4): solo precargan la matriz al
 * crear o editar; lo que se guarda son los permisos resultantes. Deben
 * coincidir con frontend/src/lib/admin/worker-templates.ts.
 */
public final class Templates {

    private static final Map<String, Map<Module, AccessLevel>> TEMPLATES = Map.of(
            "PUBLICADOR", Map.of(PUBLICATIONS, PUBLISH, PLACES, PUBLISH, EVENTS, PUBLISH, GALLERIES, PUBLISH, DIRECTORY, PUBLISH,
                    SERIES, PUBLISH, CATEGORIES, ACCESS, STATS, ACCESS),
            "GESTOR_EVENTOS", Map.of(EVENTS, PUBLISH, PLACES, PUBLISH),
            "GESTOR_DIRECTORIO", Map.of(DIRECTORY, PUBLISH, PLACES, PUBLISH),
            "PUBLICIDAD", Map.of(ADVERTISING, ACCESS, STATS, ACCESS),
            // Igual que el dueño en todo menos la auditoría (Actividad), que sigue siendo solo del dueño.
            "ADMINISTRADOR", Map.ofEntries(Map.entry(PUBLICATIONS, PUBLISH), Map.entry(PLACES, PUBLISH),
                    Map.entry(EVENTS, PUBLISH), Map.entry(GALLERIES, PUBLISH), Map.entry(DIRECTORY, PUBLISH),
                    Map.entry(SERIES, PUBLISH), Map.entry(CATEGORIES, ACCESS), Map.entry(STATS, ACCESS),
                    Map.entry(ADVERTISING, ACCESS), Map.entry(WORKERS, ACCESS), Map.entry(SETTINGS, ACCESS)));

    private Templates() {
    }

    public static Map<Module, AccessLevel> of(String name) {
        Map<Module, AccessLevel> template = TEMPLATES.get(name);
        if (template == null) {
            throw new IllegalArgumentException("Plantilla desconocida: " + name);
        }
        return template;
    }
}
