package pe.plataformacontenidos.stories;

import java.time.Duration;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.engagement.ContentViewCounter;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;
import pe.plataformacontenidos.shared.InvalidTraffic;

/**
 * Cuenta los toques del botón de una historia («Ver publicación»): cuánto
 * lleva a leer el contenido. Mismas reglas anónimas que las visitas (sin
 * cookies ni IP guardada): una vez por visitante cada {@link #DEDUP}, robots
 * fuera y un tope por minuto.
 */
@Component
public class StoryCtaCounter {

    static final Duration DEDUP = Duration.ofMinutes(30);
    static final int MAX_PER_MINUTE = 60;

    private static final String RATE_PREFIX = "stories:cta:rl:";
    private static final String SEEN_PREFIX = "stories:cta:seen:";

    private final StringRedisTemplate redis;
    private final FixedWindowRateLimiter rateLimiter;
    private final StoryService stories;

    StoryCtaCounter(StringRedisTemplate redis, FixedWindowRateLimiter rateLimiter, StoryService stories) {
        this.redis = redis;
        this.rateLimiter = rateLimiter;
        this.stories = stories;
    }

    /** Nunca falla hacia el lector: un toque descartado no es un error. */
    public void record(UUID storyId, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        String visitor = ContentViewCounter.visitorKey(clientIp, userAgent);
        if (rateLimiter.isBlocked(RATE_PREFIX, visitor, MAX_PER_MINUTE)) {
            return;
        }
        rateLimiter.recordAttempt(RATE_PREFIX, visitor, Duration.ofMinutes(1));
        if (stories.findVisible(storyId).isEmpty()) {
            return;
        }
        if (Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(SEEN_PREFIX + storyId + ":" + visitor, "1", DEDUP))) {
            stories.recordCtaClick(storyId);
        }
    }
}
