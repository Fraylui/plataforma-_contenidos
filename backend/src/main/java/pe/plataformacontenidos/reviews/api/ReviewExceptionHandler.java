package pe.plataformacontenidos.reviews.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.reviews.InvalidReviewScheduleException;
import pe.plataformacontenidos.reviews.InvalidReviewTransitionException;
import pe.plataformacontenidos.reviews.InvalidReviewYouTubeUrlException;
import pe.plataformacontenidos.reviews.ReviewAccessDeniedException;
import pe.plataformacontenidos.reviews.ReviewNotFoundException;
import pe.plataformacontenidos.reviews.ReviewPlaceNotFoundException;

@RestControllerAdvice
public class ReviewExceptionHandler {

    @ExceptionHandler(ReviewNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ReviewNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(ReviewPlaceNotFoundException.class)
    public ResponseEntity<ApiError> handlePlaceNotFound(ReviewPlaceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(ReviewAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(ReviewAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }

    @ExceptionHandler(InvalidReviewTransitionException.class)
    public ResponseEntity<ApiError> handleInvalidTransition(InvalidReviewTransitionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler(InvalidReviewScheduleException.class)
    public ResponseEntity<ApiError> handleInvalidSchedule(InvalidReviewScheduleException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidReviewYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidReviewYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
