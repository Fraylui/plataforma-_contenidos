package pe.plataformacontenidos.identity;

import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.api.dto.MeResponse;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.security.RefreshTokenService;

/** Cuenta propia ("Mi cuenta"): lo que el panel necesita de la sesión y el cambio de contraseña. */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    public AccountService(UserRepository userRepository, PermissionService permissionService, PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService, AuditService auditService) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public MeResponse me(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
        return MeResponse.from(user, permissionService.forUser(userId));
    }

    /**
     * Pide la contraseña actual, valida la nueva (PasswordPolicy), la deja
     * como definitiva y cierra las demás sesiones: si alguien más conocía la
     * anterior (p. ej. la temporal), queda afuera.
     */
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new WrongCurrentPasswordException();
        }
        PasswordPolicy.validate(currentPassword, newPassword);
        user.changePassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenService.revokeAll(userId);
        auditService.record("PASSWORD_CHANGED", AuditResult.SUCCESS, userId, user.getEmail(), "user", userId.toString(), null);
    }
}
