package pe.plataformacontenidos.shared.api;

import java.util.List;
import java.util.Map;
import org.springframework.beans.TypeMismatchException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Los errores propios de Spring MVC (cuerpo inválido, parámetro con un valor
 * que no existe, método no permitido, JSON mal formado…) en el mismo formato
 * RFC 9457 que los de cada módulo (ver Problems). Sin esto Spring los
 * reenvía a /error, que la seguridad no deja pasar, y el cliente recibe 403.
 * Última prioridad: un módulo puede responder su caso a su manera.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    /** Validación del cuerpo: un mensaje general y el detalle por campo en «errors». */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = Problems.problem(HttpStatus.BAD_REQUEST, null, "Revisa los datos enviados.");
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of("field", error.getField(),
                        "message", error.getDefaultMessage() == null ? "Valor inválido" : error.getDefaultMessage()))
                .toList();
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
    }

    /** Un parámetro con un valor que no existe (ej. {@code status=FOO}): 400 que dice cuál. */
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        String name = ex instanceof MethodArgumentTypeMismatchException mismatch ? mismatch.getName() : ex.getPropertyName();
        ProblemDetail problem = Problems.problem(HttpStatus.BAD_REQUEST, null, "Parámetro inválido: " + name);
        return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
    }

    /** Cuerpo que no se puede leer (JSON mal formado, un valor con el tipo equivocado). */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = Problems.problem(HttpStatus.BAD_REQUEST, null,
                "No se pudo leer la solicitud: revisa que los datos tengan el formato correcto.");
        return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
    }

    /** El resto de los casos de Spring llegan con título en inglés: se pasa al español. */
    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers, HttpStatusCode statusCode,
            WebRequest request) {
        if (body instanceof ProblemDetail problem) {
            Problems.localizeTitle(problem);
        }
        return super.createResponseEntity(body, headers, statusCode, request);
    }
}
