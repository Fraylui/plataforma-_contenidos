package pe.plataformacontenidos.shared.publishing.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.InvalidScheduleException;

/** Errores del flujo de publicación, los mismos para los 5 tipos (mismo formato JSON que el resto de la API). */
@RestControllerAdvice
public class PublishingExceptionHandler {

    @ExceptionHandler(InvalidPublicationTransitionException.class)
    public ResponseEntity<ApiError> invalidTransition(InvalidPublicationTransitionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler(InvalidScheduleException.class)
    public ResponseEntity<ApiError> invalidSchedule(InvalidScheduleException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
