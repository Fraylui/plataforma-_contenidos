package pe.plataformacontenidos.identity.permission;

import java.util.List;

/**
 * Rutas del panel exclusivas del dueño: las exige SecurityConfig por rol.
 * Solo la auditoría (Actividad): Trabajadores y Configuración son módulos
 * que el dueño puede asignar, p. ej. a un Administrador (2026-10-15).
 */
public final class OwnerOnlyPaths {

    public static final List<String> PATTERNS = List.of(
            "/api/v1/admin/audit/**");

    private OwnerOnlyPaths() {
    }
}
