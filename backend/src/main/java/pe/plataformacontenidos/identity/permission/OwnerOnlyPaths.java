package pe.plataformacontenidos.identity.permission;

import java.util.List;

/** Rutas del panel exclusivas del dueño (spec 2a §4.1): las exige SecurityConfig por rol. */
public final class OwnerOnlyPaths {

    public static final List<String> PATTERNS = List.of(
            "/api/v1/admin/users/**",
            "/api/v1/admin/workers/**",
            "/api/v1/admin/platform-settings/**",
            "/api/v1/admin/audit/**");

    private OwnerOnlyPaths() {
    }
}
