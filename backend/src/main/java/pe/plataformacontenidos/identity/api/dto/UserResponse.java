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
        Instant lastLoginAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getStatus(), user.getCreatedAt(), user.getLastLoginAt());
    }
}
