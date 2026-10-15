package pe.plataformacontenidos.engagement;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;
import pe.plataformacontenidos.shared.InvalidTraffic;

/**
 * Cuenta visitas anónimas (Ley 29733: sin cookies y sin guardar la IP). El
 * visitante se distingue solo por un hash corto de IP + navegador que vive en
 * Redis {@link #DEDUP} y nunca llega a la base. Reglas:
 *
 * <ul>
 * <li>Robots y clientes automáticos no cuentan ({@link InvalidTraffic}).</li>
 * <li>La misma persona en el mismo contenido cuenta una vez cada {@link #DEDUP}:
 * recargar no infla la cifra.</li>
 * <li>Una IP manda como mucho {@link #MAX_PER_MINUTE} avisos por minuto: un
 * script con ids inventados no llena Redis.</li>
 * </ul>
 *
 * Lo contado se acumula en un hash de Redis por día del sitio y
 * {@link ContentViewFlushJob} lo vuelca a engagement.content_views_daily.
 */
@Service
public class ContentViewCounter {

    static final String PENDING_KEY = "views:pending";
    static final Duration DEDUP = Duration.ofMinutes(30);
    static final int MAX_PER_MINUTE = 60;

    private static final String RATE_PREFIX = "views:rl:";
    private static final String SEEN_PREFIX = "views:seen:";

    private final StringRedisTemplate redis;
    private final FixedWindowRateLimiter rateLimiter;
    private final ZoneId siteZone;

    public ContentViewCounter(StringRedisTemplate redis, FixedWindowRateLimiter rateLimiter,
            @Value("${site.time-zone:America/Lima}") String siteTimeZone) {
        this.redis = redis;
        this.rateLimiter = rateLimiter;
        this.siteZone = ZoneId.of(siteTimeZone);
    }

    /** true si la visita se contó. Nunca falla hacia el lector: un aviso descartado no es un error. */
    public boolean record(ContentType type, UUID contentId, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return false;
        }
        String visitor = visitorKey(clientIp, userAgent);
        if (rateLimiter.isBlocked(RATE_PREFIX, visitor, MAX_PER_MINUTE)) {
            return false;
        }
        rateLimiter.recordAttempt(RATE_PREFIX, visitor, Duration.ofMinutes(1));
        String seenKey = SEEN_PREFIX + type + ":" + contentId + ":" + visitor;
        if (!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(seenKey, "1", DEDUP))) {
            return false;
        }
        redis.opsForHash().increment(PENDING_KEY, field(LocalDate.now(siteZone), type, contentId), 1);
        return true;
    }

    static String field(LocalDate day, ContentType type, UUID contentId) {
        return day + "|" + type + "|" + contentId;
    }

    /** Hash corto: distingue visitantes durante unos minutos, inútil para recuperar la IP. */
    static String visitorKey(String clientIp, String userAgent) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(("views|" + clientIp + "|" + userAgent).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 12);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
