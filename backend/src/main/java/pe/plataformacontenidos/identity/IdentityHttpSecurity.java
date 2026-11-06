package pe.plataformacontenidos.identity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.security.AccountStateFilter;
import pe.plataformacontenidos.identity.security.JwtAuthenticationFilter;
import pe.plataformacontenidos.identity.security.JwtService;
import pe.plataformacontenidos.identity.security.RefreshTokenService;

/**
 * Lo que identidad aporta a la cadena de seguridad del sitio (config.SecurityConfig):
 * leer el token y luego revisar el estado de la cuenta. Así el resto de la
 * aplicación no toca tokens, filtros ni sesiones de refresco.
 */
@Component
public class IdentityHttpSecurity {

    private final JwtService jwtService;
    private final PermissionService permissionService;
    private final RefreshTokenService refreshTokenService;

    IdentityHttpSecurity(JwtService jwtService, PermissionService permissionService,
            RefreshTokenService refreshTokenService) {
        this.jwtService = jwtService;
        this.permissionService = permissionService;
        this.refreshTokenService = refreshTokenService;
    }

    public HttpSecurity apply(HttpSecurity http) {
        return http
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
                // Después del token: cuenta desactivada → 401; contraseña temporal → solo puede cambiarla.
                .addFilterAfter(new AccountStateFilter(permissionService, refreshTokenService),
                        JwtAuthenticationFilter.class);
    }
}
