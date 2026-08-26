package pe.plataformacontenidos.media.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import pe.plataformacontenidos.media.ImageAccessDeniedException;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.InvalidImageException;
import pe.plataformacontenidos.media.TooManyUploadsException;

@RestControllerAdvice
public class MediaExceptionHandler {

    @ExceptionHandler(ImageNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ImageNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(ImageAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(ImageAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }

    @ExceptionHandler(InvalidImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(InvalidImageException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(TooManyUploadsException.class)
    public ResponseEntity<ApiError> handleTooManyUploads(TooManyUploadsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ApiError(Instant.now(), 429, ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiError(Instant.now(), 413, "El archivo excede el tamaño máximo permitido"));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
