package pe.plataformacontenidos.content.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.content.ArticleAccessDeniedException;
import pe.plataformacontenidos.content.ArticleNotFoundException;
import pe.plataformacontenidos.content.InvalidArticleTransitionException;
import pe.plataformacontenidos.content.InvalidScheduleException;
import pe.plataformacontenidos.content.InvalidYouTubeUrlException;

@RestControllerAdvice
public class ContentExceptionHandler {

    @ExceptionHandler(ArticleNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ArticleNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(ArticleAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(ArticleAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }

    @ExceptionHandler(InvalidArticleTransitionException.class)
    public ResponseEntity<ApiError> handleInvalidTransition(InvalidArticleTransitionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler(InvalidScheduleException.class)
    public ResponseEntity<ApiError> handleInvalidSchedule(InvalidScheduleException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
