package pe.plataformacontenidos.identity;

import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

@Service
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserAdminService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public User createUser(String email, String rawPassword, String displayName, Role role,
            UUID actingAdminId, Role actingAdminRole, String ipAddress) {
        if (role == Role.SUPER_ADMIN && actingAdminRole != Role.SUPER_ADMIN) {
            throw new SuperAdminManagementDeniedException();
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User(email, passwordEncoder.encode(rawPassword), displayName, role);
        User saved = userRepository.save(user);

        String actingAdminEmail = userRepository.findById(actingAdminId).map(User::getEmail).orElse(null);
        auditService.record("USER_CREATED", AuditResult.SUCCESS, actingAdminId, actingAdminEmail,
                "user", saved.getId().toString(), ipAddress);

        return saved;
    }

    /**
     * Activar/desactivar una cuenta. Dos resguardos (CONTEXTO.md sección
     * 36.4/36.5): nadie se desactiva a sí mismo (evita el bloqueo accidental
     * más común), y un ADMIN no puede tocar una cuenta SUPER_ADMIN (eso
     * solo lo hace otro SUPER_ADMIN).
     */
    public User setActive(UUID userId, boolean active, UUID actingAdminId, Role actingAdminRole, String ipAddress) {
        if (!active && userId.equals(actingAdminId)) {
            throw new CannotModifyOwnAccountException();
        }
        User user = getOrThrow(userId);
        if (user.getRole() == Role.SUPER_ADMIN && actingAdminRole != Role.SUPER_ADMIN) {
            throw new SuperAdminManagementDeniedException();
        }

        user.setActive(active);
        User saved = userRepository.save(user);

        String actingAdminEmail = userRepository.findById(actingAdminId).map(User::getEmail).orElse(null);
        auditService.record(active ? "USER_ACTIVATED" : "USER_DEACTIVATED", AuditResult.SUCCESS, actingAdminId,
                actingAdminEmail, "user", userId.toString(), ipAddress);

        return saved;
    }

    public List<User> listUsers() {
        return userRepository.findAll();
    }

    public User getOrThrow(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }
}
