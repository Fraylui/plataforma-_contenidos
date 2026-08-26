package pe.plataformacontenidos.identity;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
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

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            RefreshTokenService refreshTokenService, LoginRateLimiter loginRateLimiter,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.loginRateLimiter = loginRateLimiter;
        this.auditService = auditService;
    }

    public TokenPair login(String email, String rawPassword, String ipAddress) {
        String rateLimitKey = email.toLowerCase() + "|" + ipAddress;
        if (loginRateLimiter.isBlocked(rateLimitKey)) {
            auditService.record("LOGIN_BLOCKED_RATE_LIMIT", AuditResult.FAILURE, null, email, "user", null, ipAddress);
            throw new TooManyAttemptsException();
        }

        Optional<User> maybeUser = userRepository.findByEmailIgnoreCase(email);
        boolean valid = maybeUser.isPresent()
                && maybeUser.get().isActive()
                && passwordEncoder.matches(rawPassword, maybeUser.get().getPasswordHash());

        if (!valid) {
            loginRateLimiter.recordFailedAttempt(rateLimitKey);
            auditService.record("LOGIN_FAILURE", AuditResult.FAILURE, null, email, "user", null, ipAddress);
            throw new InvalidCredentialsException();
        }

        User user = maybeUser.get();
        loginRateLimiter.clear(rateLimitKey);
        user.recordLogin(Instant.now());
        userRepository.save(user);

        auditService.record("LOGIN_SUCCESS", AuditResult.SUCCESS, user.getId(), email, "user",
                user.getId().toString(), ipAddress);

        return issueTokenPair(user);
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

        return issueTokenPair(user);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    private TokenPair issueTokenPair(User user) {
        String accessToken = jwtService.issueAccessToken(user.getId(), user.getRole());
        String refreshToken = refreshTokenService.issue(user.getId());
        return new TokenPair(accessToken, refreshToken);
    }

    public record TokenPair(String accessToken, String refreshToken) {
    }
}
