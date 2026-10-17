package pe.plataformacontenidos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
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
    private final UserRepository userRepository;
    private final PermissionService permissionService;

    public PanelWebConfig(AuditService auditService, UserRepository userRepository, PermissionService permissionService) {
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.permissionService = permissionService;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Auditoría primero: así también registra los intentos que el control de permisos rechaza.
        registry.addInterceptor(new AdminActionAuditInterceptor(auditService,
                userId -> userRepository.findById(userId).map(User::getEmail)));
        registry.addInterceptor(new ModuleAccessInterceptor(permissionService));
    }
}
