package pe.plataformacontenidos.identity.permission;

import static pe.plataformacontenidos.identity.permission.AccessLevel.ACCESS;
import static pe.plataformacontenidos.identity.permission.AccessLevel.CREATE;
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
            "CREADOR", Map.of(ARTICLES, CREATE, PLACES, CREATE, EVENTS, CREATE, GALLERIES, CREATE, DIRECTORY, CREATE),
            "PUBLICADOR", Map.of(ARTICLES, PUBLISH, PLACES, PUBLISH, EVENTS, PUBLISH, GALLERIES, PUBLISH, DIRECTORY, PUBLISH,
                    CATEGORIES, ACCESS, STATS, ACCESS),
            "GESTOR_EVENTOS", Map.of(EVENTS, PUBLISH, PLACES, PUBLISH),
            "GESTOR_DIRECTORIO", Map.of(DIRECTORY, PUBLISH, PLACES, PUBLISH),
            "PUBLICIDAD", Map.of(ADVERTISING, ACCESS, STATS, ACCESS));

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
