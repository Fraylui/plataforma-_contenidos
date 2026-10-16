package pe.plataformacontenidos.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

/**
 * Errores de la API en un solo formato, RFC 9457 «Problem Details»
 * (application/problem+json): {@code title}, {@code status},
 * {@code detail} (el mensaje para mostrar) e {@code instance} (la ruta), más
 * {@code code} cuando el panel necesita distinguir el caso
 * (MODULE_ACCESS_DENIED, PASSWORD_CHANGE_REQUIRED…) y {@code errors} en la
 * validación campo por campo. {@code type} se omite: vale about:blank. Lo usan los manejadores de cada módulo, el
 * global (ApiExceptionHandler) y los filtros de seguridad.
 */
public final class Problems {

    /** Títulos en español (el RFC los pide legibles; el detalle va en «detail»). */
    private static final Map<Integer, String> TITLES = Map.ofEntries(
            Map.entry(400, "Solicitud inválida"),
            Map.entry(401, "Sin sesión"),
            Map.entry(403, "Sin permiso"),
            Map.entry(404, "No encontrado"),
            Map.entry(405, "Método no permitido"),
            Map.entry(406, "Formato no aceptado"),
            Map.entry(409, "Conflicto"),
            Map.entry(413, "Archivo demasiado grande"),
            Map.entry(415, "Formato no soportado"),
            Map.entry(429, "Demasiados intentos"),
            Map.entry(500, "Error interno"),
            Map.entry(502, "Error de un servicio externo"),
            Map.entry(503, "Servicio no disponible"));

    private Problems() {
    }

    public static ResponseEntity<ProblemDetail> of(HttpStatus status, String detail) {
        return of(status, null, detail);
    }

    public static ResponseEntity<ProblemDetail> of(HttpStatus status, String code, String detail) {
        return ResponseEntity.status(status).body(problem(status, code, detail));
    }

    public static ProblemDetail problem(HttpStatusCode status, String code, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        localizeTitle(problem);
        if (code != null) {
            problem.setProperty("code", code);
        }
        return problem;
    }

    /** Cambia el título estándar en inglés («Not Found») por el español. */
    static void localizeTitle(ProblemDetail problem) {
        String title = TITLES.get(problem.getStatus());
        if (title != null) {
            problem.setTitle(title);
        }
    }

    /**
     * Para los filtros de seguridad, que responden antes de llegar a Spring
     * MVC: mismo JSON escrito a mano (los textos son constantes del backend).
     */
    public static void write(HttpServletRequest request, HttpServletResponse response, int status, String code,
            String detail) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String title = TITLES.getOrDefault(status, HttpStatus.valueOf(status).getReasonPhrase());
        // Sin «type»: igual que ProblemDetail de Spring, que lo omite cuando es about:blank (el valor por defecto del RFC).
        response.getWriter().write("{\"title\":" + json(title) + ",\"status\":" + status
                + ",\"detail\":" + json(detail) + ",\"instance\":" + json(request.getRequestURI())
                + (code == null ? "" : ",\"code\":" + json(code)) + "}");
    }

    private static String json(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.append('"').toString();
    }
}
