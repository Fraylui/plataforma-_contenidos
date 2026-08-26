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
            UUID actingAdminId, String ipAddress) {
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

    public List<User> listUsers() {
        return userRepository.findAll();
    }
}
