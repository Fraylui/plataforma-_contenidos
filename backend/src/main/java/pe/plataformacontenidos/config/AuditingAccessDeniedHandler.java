package pe.plataformacontenidos.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Un trabajador con sesión que pide una ruta exclusiva del dueño (OwnerOnlyPaths)
 * lo frena Spring Security antes de llegar al controlador, así que
 * AdminActionAuditInterceptor no lo ve. Aquí se registra (hallazgo menor del
 * 2a: auditar los rechazos de acceso) y se responde igual que antes (403).
 */
class AuditingAccessDeniedHandler implements AccessDeniedHandler {

    private final AuditService auditService;
    private final UserRepository userRepository;
    private final AccessDeniedHandler delegate = new AccessDeniedHandlerImpl();

    AuditingAccessDeniedHandler(AuditService auditService, UserRepository userRepository) {
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException, ServletException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            String email = userRepository.findById(principal.userId()).map(User::getEmail).orElse(null);
            auditService.record(AdminActionAuditInterceptor.ACCESS_DENIED, AuditResult.FAILURE, principal.userId(),
                    email, "owner_only", null, request.getRemoteAddr(),
                    request.getMethod() + " " + request.getRequestURI());
        }
        delegate.handle(request, response, ex);
    }
}
