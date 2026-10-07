package pe.plataformacontenidos.identity;

import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.api.dto.MeResponse;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.security.LoginRateLimiter;
import pe.plataformacontenidos.identity.security.RefreshTokenService;

/** Cuenta propia ("Mi cuenta"): lo que el panel necesita de la sesión y el cambio de contraseña. */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final LoginRateLimiter loginRateLimiter;
    private final AuthService authService;

    public AccountService(UserRepository userRepository, PermissionService permissionService, PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService, AuditService auditService, LoginRateLimiter loginRateLimiter,
            AuthService authService) {
        this.loginRateLimiter = loginRateLimiter;
        this.authService = authService;
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
    // noRollbackFor: el intento fallido queda en la auditoría aunque se lance la excepción.
    @Transactional(noRollbackFor = WrongCurrentPasswordException.class)
    public AuthService.TokenPair changePassword(UUID userId, String currentPassword, String newPassword, String ipAddress) {
        User user = userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
        // Mismo límite que el login: con un token robado no se puede adivinar la contraseña actual.
        String attemptsKey = "password-change:" + userId;
        if (loginRateLimiter.isBlocked(attemptsKey)) {
            throw new TooManyAttemptsException();
        }
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            loginRateLimiter.recordFailedAttempt(attemptsKey);
            auditService.record("PASSWORD_CHANGE_FAILED", AuditResult.FAILURE, userId, user.getEmail(), "user", userId.toString(), ipAddress);
            throw new WrongCurrentPasswordException();
        }
        PasswordPolicy.validate(currentPassword, newPassword);
        loginRateLimiter.clear(attemptsKey);
        user.changePassword(passwordEncoder.encode(newPassword));
        user.invalidateSessions(Instant.now());
        userRepository.save(user);
        refreshTokenService.revokeAll(userId);
        auditService.record("PASSWORD_CHANGED", AuditResult.SUCCESS, userId, user.getEmail(), "user", userId.toString(), ipAddress);
        // Las demás sesiones quedan cerradas; quien cambió la contraseña sigue con una nueva.
        return authService.issueTokenPair(user);
    }
}
