package pe.plataformacontenidos.live.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.live.InvalidLiveInputException;
import pe.plataformacontenidos.live.InvalidLiveStreamException;
import pe.plataformacontenidos.live.LiveStreamNotFoundException;

@RestControllerAdvice
public class LiveExceptionHandler {

    @ExceptionHandler(LiveStreamNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(LiveStreamNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidLiveInputException.class)
    public ResponseEntity<ApiError> handleInvalidInput(InvalidLiveInputException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    /** Paso que no corresponde al estado (p. ej. terminar algo que no está en vivo): 409. */
    @ExceptionHandler(InvalidLiveStreamException.class)
    public ResponseEntity<ApiError> handleInvalid(InvalidLiveStreamException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
