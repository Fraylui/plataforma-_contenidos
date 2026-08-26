package pe.plataformacontenidos.identity.security;

import java.time.Duration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;

/**
 * Ventana fija por clave (email+IP) para mitigar fuerza bruta en login
 * (OWASP ASVS V2.2 - Authentication Verification).
 */
@Service
@EnableConfigurationProperties(LoginRateLimiterProperties.class)
public class LoginRateLimiter {

    private static final String KEY_PREFIX = "login_attempts:";

    private final FixedWindowRateLimiter rateLimiter;
    private final LoginRateLimiterProperties properties;

    public LoginRateLimiter(FixedWindowRateLimiter rateLimiter, LoginRateLimiterProperties properties) {
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    public boolean isBlocked(String key) {
        return rateLimiter.isBlocked(KEY_PREFIX, key, properties.maxAttempts());
    }

    public void recordFailedAttempt(String key) {
        rateLimiter.recordAttempt(KEY_PREFIX, key, Duration.ofMinutes(properties.windowMinutes()));
    }

    public void clear(String key) {
        rateLimiter.clear(KEY_PREFIX, key);
    }
}
