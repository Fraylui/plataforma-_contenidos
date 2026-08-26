package pe.plataformacontenidos.identity.security;

import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import pe.plataformacontenidos.identity.Role;

/** Identidad autenticada puesta en el SecurityContext por JwtAuthenticationFilter. */
public record UserPrincipal(UUID userId, Role role) {

    public List<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}
