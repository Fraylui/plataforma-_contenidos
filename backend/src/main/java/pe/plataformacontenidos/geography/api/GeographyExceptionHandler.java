package pe.plataformacontenidos.geography.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.geography.GeographicUnitNotFoundException;
import pe.plataformacontenidos.geography.InvalidGeographyHierarchyException;

@RestControllerAdvice
public class GeographyExceptionHandler {

    @ExceptionHandler(GeographicUnitNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(GeographicUnitNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidGeographyHierarchyException.class)
    public ResponseEntity<ApiError> handleInvalidHierarchy(InvalidGeographyHierarchyException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
