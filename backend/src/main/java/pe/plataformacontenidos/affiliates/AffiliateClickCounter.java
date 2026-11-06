package pe.plataformacontenidos.affiliates;

import java.time.Duration;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.engagement.ContentViewCounter;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;
import pe.plataformacontenidos.shared.InvalidTraffic;

/**
 * Cuenta los clics en enlaces de afiliado con las mismas reglas anónimas que
 * las visitas (sin cookies ni IP guardada): una vez por visitante cada
 * {@link #DEDUP}, robots fuera y un tope por minuto. Nunca impide la
 * redirección: solo decide si suma.
 */
@Component
public class AffiliateClickCounter {

    static final Duration DEDUP = Duration.ofMinutes(30);
    static final int MAX_PER_MINUTE = 60;

    private static final String RATE_PREFIX = "affiliates:click:rl:";
    private static final String SEEN_PREFIX = "affiliates:click:seen:";

    private final StringRedisTemplate redis;
    private final FixedWindowRateLimiter rateLimiter;
    private final AffiliateLinkService links;

    AffiliateClickCounter(StringRedisTemplate redis, FixedWindowRateLimiter rateLimiter, AffiliateLinkService links) {
        this.redis = redis;
        this.rateLimiter = rateLimiter;
        this.links = links;
    }

    public void record(UUID linkId, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        String visitor = ContentViewCounter.visitorKey(clientIp, userAgent);
        if (rateLimiter.isBlocked(RATE_PREFIX, visitor, MAX_PER_MINUTE)) {
            return;
        }
        rateLimiter.recordAttempt(RATE_PREFIX, visitor, Duration.ofMinutes(1));
        if (Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(SEEN_PREFIX + linkId + ":" + visitor, "1", DEDUP))) {
            links.incrementClicks(linkId);
        }
    }
}
