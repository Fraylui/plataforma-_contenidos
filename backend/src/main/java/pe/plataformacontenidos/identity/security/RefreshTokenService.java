package pe.plataformacontenidos.identity.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Refresh tokens opacos (no JWT) guardados en Redis como hash SHA-256 →
 * userId, con rotación obligatoria: cada uso invalida el token anterior y
 * emite uno nuevo. Esto permite revocación real (un JWT no se puede revocar
 * antes de expirar sin una lista negra) y limita el daño de un token
 * robado a una sola reutilización detectable.
 */
@Service
@EnableConfigurationProperties(JwtProperties.class)
public class RefreshTokenService {

    private static final String KEY_PREFIX = "refresh_token:";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final JwtProperties properties;

    public RefreshTokenService(StringRedisTemplate redisTemplate, JwtProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
    }

    public String issue(UUID userId) {
        String token = generateOpaqueToken();
        redisTemplate.opsForValue().set(
                KEY_PREFIX + hash(token),
                userId.toString(),
                Duration.ofDays(properties.refreshTokenTtlDays()));
        return token;
    }

    /** Consume (invalida) el token presentado y devuelve el userId si era válido. */
    public Optional<UUID> consume(String token) {
        String key = KEY_PREFIX + hash(token);
        String userId = redisTemplate.opsForValue().get(key);
        if (userId == null) {
            return Optional.empty();
        }
        redisTemplate.delete(key);
        return Optional.of(UUID.fromString(userId));
    }

    public void revoke(String token) {
        redisTemplate.delete(KEY_PREFIX + hash(token));
    }

    private static String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
