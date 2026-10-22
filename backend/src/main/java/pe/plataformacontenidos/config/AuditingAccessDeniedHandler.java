package pe.plataformacontenidos.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.UserDirectory;
import pe.plataformacontenidos.identity.UserPrincipal;
import pe.plataformacontenidos.shared.api.Problems;

/**
 * Un trabajador con sesión que pide una ruta exclusiva del dueño (OwnerOnlyPaths)
 * lo frena Spring Security antes de llegar al controlador, así que
 * AdminActionAuditInterceptor no lo ve. Aquí se registra (hallazgo menor del
 * 2a: auditar los rechazos de acceso) y se responde 403 en formato RFC 9457 (Problems).
 */
class AuditingAccessDeniedHandler implements AccessDeniedHandler {

    private final AuditService auditService;
    private final UserDirectory users;

    AuditingAccessDeniedHandler(AuditService auditService, UserDirectory users) {
        this.auditService = auditService;
        this.users = users;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException, ServletException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            String email = users.emailOf(principal.userId()).orElse(null);
            auditService.record(AdminActionAuditInterceptor.ACCESS_DENIED, AuditResult.FAILURE, principal.userId(),
                    email, "owner_only", null, request.getRemoteAddr(),
                    request.getMethod() + " " + request.getRequestURI());
        }
        Problems.write(request, response, HttpServletResponse.SC_FORBIDDEN, "ACCESS_DENIED", "No tienes permiso para esto.");
    }
}
