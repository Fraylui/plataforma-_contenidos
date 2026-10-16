package pe.plataformacontenidos.directory.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.directory.BusinessNotFoundException;
import pe.plataformacontenidos.directory.BusinessPlaceNotFoundException;
import pe.plataformacontenidos.directory.InvalidBusinessImageException;
import pe.plataformacontenidos.directory.InvalidBusinessYouTubeUrlException;

@RestControllerAdvice
public class BusinessExceptionHandler {

    @ExceptionHandler(BusinessNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(BusinessNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BusinessPlaceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handlePlaceNotFound(BusinessPlaceNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidBusinessYouTubeUrlException.class)
    public ResponseEntity<ProblemDetail> handleInvalidYouTubeUrl(InvalidBusinessYouTubeUrlException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidBusinessImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidBusinessImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
