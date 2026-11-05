package pe.plataformacontenidos.content.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.content.PublicationNotFoundException;
import pe.plataformacontenidos.content.InvalidPublicationImageException;
import pe.plataformacontenidos.content.InvalidYouTubeUrlException;

@RestControllerAdvice
public class ContentExceptionHandler {

    @ExceptionHandler(PublicationNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(PublicationNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidYouTubeUrlException.class)
    public ResponseEntity<ProblemDetail> handleInvalidYouTubeUrl(InvalidYouTubeUrlException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidPublicationImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidPublicationImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
