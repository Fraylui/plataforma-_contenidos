package pe.plataformacontenidos.identity.permission;

import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserNotFoundException;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.UserStatus;

/**
 * Permisos vigentes de un usuario, leídos de la base en cada llamada (sin
 * caché a propósito: quitar un permiso o desactivar a alguien rige en la
 * siguiente petición). Dos consultas por clave: usuario y sus filas.
 */
@Service
public class PermissionService {

    private final UserRepository userRepository;
    private final WorkerPermissionRepository repository;

    public PermissionService(UserRepository userRepository, WorkerPermissionRepository repository) {
        this.userRepository = userRepository;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Permissions forUser(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        Map<Module, AccessLevel> levels = new EnumMap<>(Module.class);
        repository.findByUserId(userId).forEach(p -> levels.put(p.getModule(), p.getLevel()));
        return new Permissions(userId, user.getRole() == Role.SUPER_ADMIN, user.getStatus() == UserStatus.ACTIVE,
                user.isMustChangePassword(), levels);
    }
}
