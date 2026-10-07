package pe.plataformacontenidos.directory.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.directory.BusinessAccessDeniedException;
import pe.plataformacontenidos.directory.BusinessNotFoundException;
import pe.plataformacontenidos.directory.BusinessPlaceNotFoundException;
import pe.plataformacontenidos.directory.InvalidBusinessImageException;
import pe.plataformacontenidos.directory.InvalidBusinessYouTubeUrlException;

@RestControllerAdvice
public class BusinessExceptionHandler {

    @ExceptionHandler(BusinessNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(BusinessNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(BusinessPlaceNotFoundException.class)
    public ResponseEntity<ApiError> handlePlaceNotFound(BusinessPlaceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(BusinessAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(BusinessAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }



    @ExceptionHandler(InvalidBusinessYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidBusinessYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidBusinessImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(InvalidBusinessImageException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
