package pe.plataformacontenidos.engagement.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pe.plataformacontenidos.engagement.ContentViewCounter;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;

/**
 * Tope para los «me gusta» y las reacciones anónimas: son escrituras públicas
 * (sin cuenta) y sus cifras se muestran a la gente y a los anunciantes, así
 * que un script con visitorIds inventados no debe poder inflarlas.
 *
 Como mucho {@code engagement.writes-per-minute} (30) escrituras por minuto
 * por visitante (hash corto de IP + navegador, igual que las visitas; la IP no
 * se guarda, Ley 29733); pasado eso, 429. Una persona real no llega a ese
 * ritmo. La IP real llega desde Next (lib/forward-visitor.ts) vía
 * X-Forwarded-For de la red interna (server.forward-headers-strategy).
 */
@Component
public class EngagementWriteGuardFilter extends OncePerRequestFilter {

    private static final String RATE_PREFIX = "engagement:rl:";

    private final FixedWindowRateLimiter rateLimiter;
    private final int maxPerMinute;

    public EngagementWriteGuardFilter(FixedWindowRateLimiter rateLimiter,
            @Value("${engagement.writes-per-minute:30}") int maxPerMinute) {
        this.rateLimiter = rateLimiter;
        this.maxPerMinute = maxPerMinute;
    }

    /** POST /api/v1/reactions y POST /api/v1/…/{id}/like (publicaciones, lugares, galerías, episodios, historias…). */
    static boolean isEngagementWrite(String method, String path) {
        return "POST".equals(method)
                && path.startsWith("/api/v1/")
                && (path.equals("/api/v1/reactions") || path.endsWith("/like"));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !isEngagementWrite(request.getMethod(), request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String visitor = ContentViewCounter.visitorKey(request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        if (rateLimiter.isBlocked(RATE_PREFIX, visitor, maxPerMinute)) {
            response.setHeader(HttpHeaders.RETRY_AFTER, "60");
            reject(response, HttpStatus.TOO_MANY_REQUESTS, "Demasiadas reacciones seguidas. Prueba en un minuto.");
            return;
        }
        rateLimiter.recordAttempt(RATE_PREFIX, visitor, Duration.ofMinutes(1));
        chain.doFilter(request, response);
    }

    private static void reject(HttpServletResponse response, HttpStatus status, String detail) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":" + status.value() + ",\"detail\":\"" + detail + "\"}");
    }
}
