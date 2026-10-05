package pe.plataformacontenidos.feed.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.plataformacontenidos.feed.InvalidFeedTypeException;

/**
 * Mismo patrón que el resto de módulos (ContentExceptionHandler, ...):
 * responde el error directamente. Un ResponseStatusException se reenviaba a
 * /error, que la seguridad no deja pasar, y el cliente recibía 403 en vez
 * del 400 real (los tests con MockMvc no lo veían: no hacen ese reenvío).
 */
@RestControllerAdvice(assignableTypes = FeedController.class)
public class FeedExceptionHandler {

    @ExceptionHandler(InvalidFeedTypeException.class)
    public ResponseEntity<ApiError> handleInvalidType(InvalidFeedTypeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    /** Un parámetro con valor que no existe (ej. type=FOO): también es un 400, no un 403. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(Instant.now(), 400, "Parámetro inválido: " + ex.getName()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
