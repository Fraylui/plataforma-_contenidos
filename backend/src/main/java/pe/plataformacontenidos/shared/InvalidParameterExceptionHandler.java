package pe.plataformacontenidos.shared;

import java.time.Instant;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Un parámetro con un valor que no existe (ej. {@code status=FOO} en un
 * listado del panel) es un 400 en cualquier endpoint. Sin esto Spring lo
 * reenvía a /error, que la seguridad no deja pasar, y el cliente recibe 403
 * (ver FeedExceptionHandler). Última prioridad: un módulo puede responderlo
 * a su manera.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class InvalidParameterExceptionHandler {

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(Instant.now(), 400, "Parámetro inválido: " + ex.getName()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
