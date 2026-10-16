package pe.plataformacontenidos.celebrations.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.celebrations.CelebrationNotFoundException;
import pe.plataformacontenidos.celebrations.CelebrationPlaceNotFoundException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationDateRangeException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationImageException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationScopeException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationYouTubeUrlException;

@RestControllerAdvice
public class CelebrationExceptionHandler {

    @ExceptionHandler(CelebrationNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(CelebrationNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(CelebrationPlaceNotFoundException.class)
    public ResponseEntity<ApiError> handlePlaceNotFound(CelebrationPlaceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidCelebrationYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidCelebrationYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidCelebrationDateRangeException.class)
    public ResponseEntity<ApiError> handleInvalidDateRange(InvalidCelebrationDateRangeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidCelebrationImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(InvalidCelebrationImageException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidCelebrationScopeException.class)
    public ResponseEntity<ApiError> handleInvalidScope(InvalidCelebrationScopeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
