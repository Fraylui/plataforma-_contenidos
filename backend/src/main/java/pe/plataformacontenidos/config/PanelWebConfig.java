package pe.plataformacontenidos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.UserDirectory;
import pe.plataformacontenidos.identity.permission.ModuleAccessInterceptor;
import pe.plataformacontenidos.identity.permission.PermissionService;

/**
 * Interceptores del panel: permisos por módulo (ModuleAccessInterceptor,
 * antes del controlador) y auditoría automática de cada acción
 * (AdminActionAuditInterceptor, al terminar).
 */
@Configuration
public class PanelWebConfig implements WebMvcConfigurer {

    private final AuditService auditService;
    private final UserDirectory users;
    private final PermissionService permissionService;

    public PanelWebConfig(AuditService auditService, UserDirectory users, PermissionService permissionService) {
        this.auditService = auditService;
        this.users = users;
        this.permissionService = permissionService;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Auditoría primero: así también registra los intentos que el control de permisos rechaza.
        registry.addInterceptor(new AdminActionAuditInterceptor(auditService,
                users::emailOf));
        registry.addInterceptor(new ModuleAccessInterceptor(permissionService));
    }
}
