package pe.plataformacontenidos.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Auditoría de toda acción del panel que modifica algo (ISO 27001 A.8.15,
 * COBIT DSS06): cada POST/PUT/PATCH/DELETE hecho por un usuario autenticado
 * del panel queda registrado con quién, qué (método + ruta, p. ej. "POST
 * /admin/articles/{id}/publish" o "PUT /categories/{id}"), sobre qué
 * recurso, desde qué IP y si salió bien o fue rechazado (4xx/5xx). Las
 * acciones públicas y anónimas (me gusta, impresiones de anuncios) no son
 * del panel y no se registran: masivas y sin valor de auditoría.
 *
 * Un solo punto en vez de una línea de auditoría en cada método de cada
 * servicio: cualquier endpoint nuevo del panel queda auditado sin tocar
 * código.
 *
 * Las acciones que ya registran un evento propio más preciso (login,
 * usuarios, configuración, imágenes) marcan la petición
 * (AuditService.RECORDED_ATTRIBUTE) y acá no se duplican.
 */
public class AdminActionAuditInterceptor implements HandlerInterceptor {

    private static final String API_PREFIX = "/api/v1";
    private static final Set<String> MUTATING = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final AuditService auditService;
    private final Function<UUID, Optional<String>> emailOf;

    public AdminActionAuditInterceptor(AuditService auditService, Function<UUID, Optional<String>> emailOf) {
        this.auditService = auditService;
        this.emailOf = emailOf;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UUID actor = currentActor();
        if (actor == null || !MUTATING.contains(request.getMethod())
                || request.getAttribute(AuditService.RECORDED_ATTRIBUTE) != null) {
            return;
        }
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String path = pattern instanceof String p ? p : request.getRequestURI();
        String route = path.startsWith(API_PREFIX) ? path.substring(API_PREFIX.length()) : path;
        String resourceType = route.replaceFirst("^/(admin/)?", "").split("/", 2)[0];
        AuditResult result = ex == null && response.getStatus() < 400 ? AuditResult.SUCCESS : AuditResult.FAILURE;

        auditService.record(request.getMethod() + " " + route, result, actor,
                emailOf.apply(actor).orElse(null),
                resourceType, resourceId(request), request.getRemoteAddr());
    }

    private static UUID currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal principal ? principal.userId() : null;
    }

    @SuppressWarnings("unchecked")
    private static String resourceId(HttpServletRequest request) {
        Object vars = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        return vars instanceof Map<?, ?> map ? ((Map<String, String>) map).get("id") : null;
    }
}
