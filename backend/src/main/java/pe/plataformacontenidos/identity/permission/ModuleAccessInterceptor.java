package pe.plataformacontenidos.identity.permission;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Exige el @RequiresModule del endpoint (método o clase) contra los
 * permisos vigentes del usuario, leídos en cada petición: quitar un permiso
 * rige enseguida, aunque el token siga vigente.
 */
public class ModuleAccessInterceptor implements HandlerInterceptor {

    private final PermissionService permissionService;

    public ModuleAccessInterceptor(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }
        RequiresAnyModule anyOf = method.getMethodAnnotation(RequiresAnyModule.class);
        if (anyOf != null) {
            Permissions permissions = currentPermissions();
            if (permissions == null || java.util.Arrays.stream(anyOf.value()).noneMatch(m -> permissions.can(m, AccessLevel.CREATE))) {
                throw new ModuleAccessDeniedException();
            }
            return true;
        }
        RequiresModule required = method.getMethodAnnotation(RequiresModule.class);
        if (required == null) {
            required = AnnotatedElementUtils.findMergedAnnotation(method.getBeanType(), RequiresModule.class);
        }
        if (required == null) {
            return true;
        }
        Permissions permissions = currentPermissions();
        if (permissions == null || !permissions.can(required.value(), required.level())) {
            throw new ModuleAccessDeniedException();
        }
        return true;
    }

    private Permissions currentPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal principal
                ? permissionService.forUser(principal.userId())
                : null;
    }
}
