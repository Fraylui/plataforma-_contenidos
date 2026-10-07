package pe.plataformacontenidos.identity.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import pe.plataformacontenidos.identity.UserNotFoundException;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.Permissions;

/**
 * Estado de la cuenta en cada petición autenticada (spec 2a §4.3), después
 * de validar el token: una cuenta desactivada recibe 401 aunque su token
 * siga vigente (y se cierran sus sesiones); con contraseña temporal solo se
 * puede ver la propia cuenta, cambiar la contraseña o cerrar sesión.
 */
public class AccountStateFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_WITH_TEMPORARY_PASSWORD = Set.of(
            "GET /api/v1/users/me", "POST /api/v1/users/me/password", "POST /api/v1/auth/logout");

    private final PermissionService permissionService;
    private final RefreshTokenService refreshTokenService;

    public AccountStateFilter(PermissionService permissionService, RefreshTokenService refreshTokenService) {
        this.permissionService = permissionService;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            Permissions permissions;
            try {
                permissions = permissionService.forUser(principal.userId());
            } catch (UserNotFoundException e) {
                reject(response, HttpServletResponse.SC_UNAUTHORIZED, "ACCOUNT_DISABLED", "Tu cuenta no está activa.");
                return;
            }
            if (!permissions.active()) {
                refreshTokenService.revokeAll(principal.userId());
                reject(response, HttpServletResponse.SC_UNAUTHORIZED, "ACCOUNT_DISABLED", "Tu cuenta no está activa.");
                return;
            }
            if (permissions.mustChangePassword()
                    && !ALLOWED_WITH_TEMPORARY_PASSWORD.contains(request.getMethod() + " " + request.getRequestURI())) {
                reject(response, HttpServletResponse.SC_FORBIDDEN, "PASSWORD_CHANGE_REQUIRED",
                        "Cambia tu contraseña temporal para continuar.");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private static void reject(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"code\":\"" + code + "\",\"message\":\"" + message + "\"}");
    }
}
