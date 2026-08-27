package pe.plataformacontenidos.galleries.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.galleries.GalleryAccessDeniedException;
import pe.plataformacontenidos.galleries.GalleryNotFoundException;
import pe.plataformacontenidos.galleries.InvalidGalleryImageCountException;
import pe.plataformacontenidos.galleries.InvalidGalleryScheduleException;
import pe.plataformacontenidos.galleries.InvalidGalleryTransitionException;

@RestControllerAdvice
public class GalleryExceptionHandler {

    @ExceptionHandler(GalleryNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(GalleryNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(GalleryAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(GalleryAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }

    @ExceptionHandler(InvalidGalleryTransitionException.class)
    public ResponseEntity<ApiError> handleInvalidTransition(InvalidGalleryTransitionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler(InvalidGalleryScheduleException.class)
    public ResponseEntity<ApiError> handleInvalidSchedule(InvalidGalleryScheduleException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidGalleryImageCountException.class)
    public ResponseEntity<ApiError> handleInvalidImageCount(InvalidGalleryImageCountException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
