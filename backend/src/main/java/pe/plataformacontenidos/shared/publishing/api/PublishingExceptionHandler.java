package pe.plataformacontenidos.shared.publishing.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.InvalidScheduleException;

/** Errores del flujo de publicación, los mismos para los 5 tipos (mismo formato JSON que el resto de la API). */
@RestControllerAdvice
public class PublishingExceptionHandler {

    @ExceptionHandler(InvalidPublicationTransitionException.class)
    public ResponseEntity<ProblemDetail> invalidTransition(InvalidPublicationTransitionException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(InvalidScheduleException.class)
    public ResponseEntity<ProblemDetail> invalidSchedule(InvalidScheduleException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
