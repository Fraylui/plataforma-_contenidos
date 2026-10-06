package pe.plataformacontenidos.identity.api.dto;

import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.Permissions;

/** Sesión actual para el panel (spec 2a §5): rol, permisos por módulo y si debe cambiar la contraseña. */
public record MeResponse(UUID id, String email, String firstName, String lastName, Role role,
        boolean mustChangePassword, Map<Module, AccessLevel> permissions) {

    public static MeResponse from(User user, Permissions permissions) {
        return new MeResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole(),
                user.isMustChangePassword(), permissions.levels());
    }
}
