package pe.plataformacontenidos.identity.security;

import java.time.Duration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Ventana fija por clave (email+IP) para mitigar fuerza bruta en login
 * (OWASP ASVS V2.2 - Authentication Verification). No es un rate limiter
 * genérico de API: eso se evalúa aparte si el tráfico real lo justifica.
 */
@Service
@EnableConfigurationProperties(LoginRateLimiterProperties.class)
public class LoginRateLimiter {

    private static final String KEY_PREFIX = "login_attempts:";

    private final StringRedisTemplate redisTemplate;
    private final LoginRateLimiterProperties properties;

    public LoginRateLimiter(StringRedisTemplate redisTemplate, LoginRateLimiterProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
    }

    public boolean isBlocked(String key) {
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + key);
        if (value == null) {
            return false;
        }
        return Long.parseLong(value) >= properties.maxAttempts();
    }

    public void recordFailedAttempt(String key) {
        String redisKey = KEY_PREFIX + key;
        Long attempts = redisTemplate.opsForValue().increment(redisKey);
        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(redisKey, Duration.ofMinutes(properties.windowMinutes()));
        }
    }

    public void clear(String key) {
        redisTemplate.delete(KEY_PREFIX + key);
    }
}
