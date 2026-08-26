package pe.plataformacontenidos.identity.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserStatus;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        Role role,
        UserStatus status,
        Instant createdAt,
        Instant lastLoginAt,
        boolean mfaEnabled) {

    /**
     * mfaEnabled se pide explícito (no un default silencioso) para que cada
     * caller decida conscientemente su valor: un usuario recién creado es
     * false sin necesidad de consultar MfaService; /users/me y el listado de
     * admin sí lo consultan (CONTEXTO.md sección 36.5).
     */
    public static UserResponse from(User user, boolean mfaEnabled) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getStatus(), user.getCreatedAt(), user.getLastLoginAt(), mfaEnabled);
    }
}
