package pe.plataformacontenidos.advertising.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.advertising.AdPlacementNotFoundException;
import pe.plataformacontenidos.advertising.DuplicateAdPlacementKeyException;

@RestControllerAdvice
public class AdvertisingExceptionHandler {

    @ExceptionHandler(AdPlacementNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(AdPlacementNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(DuplicateAdPlacementKeyException.class)
    public ResponseEntity<ApiError> handleDuplicateKey(DuplicateAdPlacementKeyException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
