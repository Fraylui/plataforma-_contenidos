package pe.plataformacontenidos.shared;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Identificador de cada petición (ISO 27001 A.8.15 registro de eventos,
 * ITIL gestión de incidentes): va en todos los logs de esa petición (MDC
 * "requestId", incluido en el JSON estructurado y en el patrón de texto) y
 * en la respuesta (cabecera X-Request-Id), así un error que reporta alguien
 * se encuentra en los logs de punta a punta.
 *
 * Reutiliza el que manda nginx ($request_id) solo si es seguro: letras,
 * números y guiones, hasta 64 caracteres. Cualquier otra cosa se descarta
 * y se genera uno nuevo — un valor con saltos de línea permitiría falsificar
 * líneas de log (OWASP, log injection).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && SAFE_ID.matcher(incoming).matches()
                ? incoming
                : UUID.randomUUID().toString();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
