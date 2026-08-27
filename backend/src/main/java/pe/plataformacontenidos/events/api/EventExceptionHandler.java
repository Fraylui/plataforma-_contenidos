package pe.plataformacontenidos.events.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.events.EventAccessDeniedException;
import pe.plataformacontenidos.events.EventNotFoundException;
import pe.plataformacontenidos.events.EventPlaceNotFoundException;
import pe.plataformacontenidos.events.InvalidEventDateRangeException;
import pe.plataformacontenidos.events.InvalidEventScheduleException;
import pe.plataformacontenidos.events.InvalidEventTransitionException;
import pe.plataformacontenidos.events.InvalidEventYouTubeUrlException;

@RestControllerAdvice
public class EventExceptionHandler {

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(EventNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(EventPlaceNotFoundException.class)
    public ResponseEntity<ApiError> handlePlaceNotFound(EventPlaceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(EventAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(EventAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(Instant.now(), 403, ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventTransitionException.class)
    public ResponseEntity<ApiError> handleInvalidTransition(InvalidEventTransitionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventScheduleException.class)
    public ResponseEntity<ApiError> handleInvalidSchedule(InvalidEventScheduleException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventYouTubeUrlException.class)
    public ResponseEntity<ApiError> handleInvalidYouTubeUrl(InvalidEventYouTubeUrlException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventDateRangeException.class)
    public ResponseEntity<ApiError> handleInvalidDateRange(InvalidEventDateRangeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
