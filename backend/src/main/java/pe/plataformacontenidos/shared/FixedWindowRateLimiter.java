package pe.plataformacontenidos.shared;

import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Ventana fija genérica sobre Redis, compartida por cualquier caso de uso
 * que necesite limitar intentos por clave (login, subida de imágenes, ...).
 * Cada consumidor aporta su propio prefijo de clave y sus propios límites
 * (ver LoginRateLimiter / ImageUploadRateLimiter) — esto solo implementa el
 * mecanismo de conteo, no una política.
 */
@Service
public class FixedWindowRateLimiter {

    private final StringRedisTemplate redisTemplate;

    public FixedWindowRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean isBlocked(String keyPrefix, String key, int maxAttempts) {
        String value = redisTemplate.opsForValue().get(keyPrefix + key);
        if (value == null) {
            return false;
        }
        return Long.parseLong(value) >= maxAttempts;
    }

    public void recordAttempt(String keyPrefix, String key, Duration window) {
        String redisKey = keyPrefix + key;
        Long attempts = redisTemplate.opsForValue().increment(redisKey);
        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(redisKey, window);
        }
    }

    public void clear(String keyPrefix, String key) {
        redisTemplate.delete(keyPrefix + key);
    }
}
