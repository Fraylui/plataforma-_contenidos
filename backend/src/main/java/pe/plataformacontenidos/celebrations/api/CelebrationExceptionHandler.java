package pe.plataformacontenidos.celebrations.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.celebrations.CelebrationNotFoundException;
import pe.plataformacontenidos.celebrations.CelebrationPlaceNotFoundException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationDateRangeException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationImageException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationScopeException;
import pe.plataformacontenidos.celebrations.InvalidCelebrationYouTubeUrlException;

@RestControllerAdvice
public class CelebrationExceptionHandler {

    @ExceptionHandler(CelebrationNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(CelebrationNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CelebrationPlaceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handlePlaceNotFound(CelebrationPlaceNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidCelebrationYouTubeUrlException.class)
    public ResponseEntity<ProblemDetail> handleInvalidYouTubeUrl(InvalidCelebrationYouTubeUrlException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidCelebrationDateRangeException.class)
    public ResponseEntity<ProblemDetail> handleInvalidDateRange(InvalidCelebrationDateRangeException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidCelebrationImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidCelebrationImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidCelebrationScopeException.class)
    public ResponseEntity<ProblemDetail> handleInvalidScope(InvalidCelebrationScopeException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
