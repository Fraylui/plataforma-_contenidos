package pe.plataformacontenidos.galleries.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.galleries.GalleryAccessDeniedException;
import pe.plataformacontenidos.galleries.GalleryNotFoundException;
import pe.plataformacontenidos.galleries.InvalidGalleryImageCountException;
import pe.plataformacontenidos.galleries.InvalidGalleryImageException;

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



    @ExceptionHandler(InvalidGalleryImageCountException.class)
    public ResponseEntity<ApiError> handleInvalidImageCount(InvalidGalleryImageCountException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidGalleryImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(InvalidGalleryImageException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
