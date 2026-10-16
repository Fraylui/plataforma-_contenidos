package pe.plataformacontenidos.live.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.live.InvalidLiveInputException;
import pe.plataformacontenidos.live.InvalidLiveStreamException;
import pe.plataformacontenidos.live.LiveStreamNotFoundException;

@RestControllerAdvice
public class LiveExceptionHandler {

    @ExceptionHandler(LiveStreamNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(LiveStreamNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidLiveInputException.class)
    public ResponseEntity<ProblemDetail> handleInvalidInput(InvalidLiveInputException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Paso que no corresponde al estado (p. ej. terminar algo que no está en vivo): 409. */
    @ExceptionHandler(InvalidLiveStreamException.class)
    public ResponseEntity<ProblemDetail> handleInvalid(InvalidLiveStreamException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }
}
