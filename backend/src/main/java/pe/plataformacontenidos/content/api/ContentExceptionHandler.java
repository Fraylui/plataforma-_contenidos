package pe.plataformacontenidos.content.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.content.PublicationNotFoundException;
import pe.plataformacontenidos.content.InvalidPublicationImageException;
import pe.plataformacontenidos.content.InvalidYouTubeUrlException;

@RestControllerAdvice
public class ContentExceptionHandler {

    @ExceptionHandler(PublicationNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(PublicationNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidPublicationImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(InvalidPublicationImageException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
