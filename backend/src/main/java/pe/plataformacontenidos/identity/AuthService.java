package pe.plataformacontenidos.identity;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.mfa.MfaService;
import pe.plataformacontenidos.identity.security.JwtService;
import pe.plataformacontenidos.identity.security.LoginRateLimiter;
import pe.plataformacontenidos.identity.security.RefreshTokenService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final LoginRateLimiter loginRateLimiter;
    private final AuditService auditService;
    private final MfaService mfaService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            RefreshTokenService refreshTokenService, LoginRateLimiter loginRateLimiter,
            AuditService auditService, MfaService mfaService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.loginRateLimiter = loginRateLimiter;
        this.auditService = auditService;
        this.mfaService = mfaService;
    }

    public TokenPair login(String email, String rawPassword, String mfaCode, String ipAddress) {
        String rateLimitKey = email.toLowerCase() + "|" + ipAddress;
        if (loginRateLimiter.isBlocked(rateLimitKey)) {
            auditService.record("LOGIN_BLOCKED_RATE_LIMIT", AuditResult.FAILURE, null, email, "user", null, ipAddress);
            throw new TooManyAttemptsException();
        }

        Optional<User> maybeUser = userRepository.findByEmailIgnoreCase(email);
        boolean validPassword = maybeUser.isPresent()
                && maybeUser.get().isActive()
                && passwordEncoder.matches(rawPassword, maybeUser.get().getPasswordHash());

        if (!validPassword) {
            loginRateLimiter.recordFailedAttempt(rateLimitKey);
            auditService.record("LOGIN_FAILURE", AuditResult.FAILURE, null, email, "user", null, ipAddress);
            throw new InvalidCredentialsException();
        }

        User user = maybeUser.get();
        boolean mfaSetupRequired = evaluateMfa(user, mfaCode, rateLimitKey, ipAddress);

        loginRateLimiter.clear(rateLimitKey);
        user.recordLogin(Instant.now());
        userRepository.save(user);

        auditService.record("LOGIN_SUCCESS", AuditResult.SUCCESS, user.getId(), email, "user",
                user.getId().toString(), ipAddress);

        return issueTokenPair(user, mfaSetupRequired);
    }

    /**
     * SUPER_ADMIN requiere MFA "sin excepción" una vez habilitado (CONTEXTO.md
     * 36.5). Si todavía no lo habilitó (caso inevitable del primer login tras
     * el bootstrap), se deja pasar pero se audita como advertencia y se marca
     * mfaSetupRequired para que el cliente fuerce el enrolamiento.
     */
    private boolean evaluateMfa(User user, String mfaCode, String rateLimitKey, String ipAddress) {
        if (user.getRole() != Role.SUPER_ADMIN) {
            return false;
        }

        if (!mfaService.isEnabled(user.getId())) {
            auditService.record("SUPER_ADMIN_LOGIN_WITHOUT_MFA", AuditResult.FAILURE, user.getId(), user.getEmail(),
                    "user", user.getId().toString(), ipAddress);
            return true;
        }

        if (!mfaService.verifyChallenge(user.getId(), mfaCode)) {
            loginRateLimiter.recordFailedAttempt(rateLimitKey);
            auditService.record("LOGIN_MFA_FAILURE", AuditResult.FAILURE, user.getId(), user.getEmail(),
                    "user", user.getId().toString(), ipAddress);
            throw new MfaRequiredException();
        }

        return false;
    }

    public TokenPair refresh(String refreshToken, String ipAddress) {
        Optional<UUID> userId = refreshTokenService.consume(refreshToken);
        if (userId.isEmpty()) {
            auditService.record("TOKEN_REFRESH_INVALID", AuditResult.FAILURE, null, null, "refresh_token", null, ipAddress);
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findById(userId.get())
                .filter(User::isActive)
                .orElseThrow(InvalidCredentialsException::new);

        auditService.record("TOKEN_REFRESHED", AuditResult.SUCCESS, user.getId(), user.getEmail(), "user",
                user.getId().toString(), ipAddress);

        return issueTokenPair(user, false);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    private TokenPair issueTokenPair(User user, boolean mfaSetupRequired) {
        String accessToken = jwtService.issueAccessToken(user.getId(), user.getRole());
        String refreshToken = refreshTokenService.issue(user.getId());
        return new TokenPair(accessToken, refreshToken, mfaSetupRequired);
    }

    public record TokenPair(String accessToken, String refreshToken, boolean mfaSetupRequired) {
    }
}
