package pe.plataformacontenidos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;

/** Registra la auditoría automática de las acciones del panel (ver AdminActionAuditInterceptor). */
@Configuration
public class AuditWebConfig implements WebMvcConfigurer {

    private final AuditService auditService;
    private final UserRepository userRepository;

    public AuditWebConfig(AuditService auditService, UserRepository userRepository) {
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AdminActionAuditInterceptor(auditService,
                userId -> userRepository.findById(userId).map(User::getEmail)));
    }
}
