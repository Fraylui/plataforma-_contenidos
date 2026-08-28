package pe.plataformacontenidos.identity.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.plataformacontenidos.identity.Role;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 12, message = "la contraseña debe tener al menos 12 caracteres") String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotNull Role role) {
}
