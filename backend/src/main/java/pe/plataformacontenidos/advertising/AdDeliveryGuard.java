package pe.plataformacontenidos.advertising;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Las reglas anti-saturación y anti-fraude de un ad server, sobre Redis y
 * sin cookies (no necesitan consentimiento: el visitante se identifica solo
 * por un hash de su IP, que vive en Redis unas horas y nunca en la base):
 *
 * <ul>
 * <li><b>Tope de frecuencia</b>: una misma persona ve una campaña como mucho
 * {@value #DAILY_FREQUENCY_CAP} veces por día (UTC). Pasado el tope, la
 * campaña deja de ofrecérsele hasta el día siguiente — ver el mismo anuncio
 * una y otra vez es lo que hace que un sitio se sienta "spam", y además
 * quema el presupuesto del anunciante en alguien que ya lo vio.</li>
 * <li><b>Impresión duplicada</b>: la misma campaña para la misma persona no
 * se cuenta dos veces dentro de {@link #IMPRESSION_DEDUP}: recargas rápidas
 * o un script repitiendo el aviso no inflan las cifras.</li>
 * <li><b>Clic duplicado</b>: un clic por persona y campaña cada
 * {@link #CLICK_DEDUP}. El visitante igual llega al destino; solo no se
 * vuelve a contar (es la regla habitual de "clic válido").</li>
 * </ul>
 */
@Component
class AdDeliveryGuard {

    static final int DAILY_FREQUENCY_CAP = 6;
    static final Duration IMPRESSION_DEDUP = Duration.ofSeconds(10);
    static final Duration CLICK_DEDUP = Duration.ofMinutes(30);

    private static final String PREFIX = "ads:";
    private static final Duration FREQUENCY_TTL = Duration.ofHours(26);

    private final StringRedisTemplate redis;

    AdDeliveryGuard(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** Hash corto de la IP: suficiente para distinguir visitantes, inútil para recuperar la IP. */
    static String visitorKey(String clientIp) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(("ads|" + clientIp).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 12);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    /** Cuáles de las campañas ya alcanzaron el tope diario para este visitante (mismo orden que la entrada). */
    List<Boolean> frequencyCapped(String visitor, List<UUID> campaignIds) {
        if (campaignIds.isEmpty()) {
            return List.of();
        }
        List<String> values = redis.opsForValue()
                .multiGet(campaignIds.stream().map(id -> frequencyKey(visitor, id)).toList());
        return IntStream.range(0, campaignIds.size()).mapToObj(i -> {
            String value = values == null ? null : values.get(i);
            return value != null && Long.parseLong(value) >= DAILY_FREQUENCY_CAP;
        }).toList();
    }

    /** true si esta impresión cuenta (no es un duplicado reciente); de ser así, suma al tope diario. */
    boolean acceptImpression(String visitor, UUID campaignId) {
        if (!firstWithin(PREFIX + "imp:" + campaignId + ":" + visitor, IMPRESSION_DEDUP)) {
            return false;
        }
        String key = frequencyKey(visitor, campaignId);
        Long views = redis.opsForValue().increment(key);
        if (views != null && views == 1L) {
            redis.expire(key, FREQUENCY_TTL);
        }
        return true;
    }

    boolean acceptClick(String visitor, UUID campaignId) {
        return firstWithin(PREFIX + "clk:" + campaignId + ":" + visitor, CLICK_DEDUP);
    }

    private boolean firstWithin(String key, Duration window) {
        return Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(key, "1", window));
    }

    private static String frequencyKey(String visitor, UUID campaignId) {
        return PREFIX + "freq:" + LocalDate.now(ZoneOffset.UTC) + ":" + campaignId + ":" + visitor;
    }
}
