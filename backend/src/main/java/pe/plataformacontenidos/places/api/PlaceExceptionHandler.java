package pe.plataformacontenidos.places.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.places.InvalidPlaceImageException;
import pe.plataformacontenidos.places.InvalidPlaceYouTubeUrlException;
import pe.plataformacontenidos.places.PlaceNotFoundException;

@RestControllerAdvice
public class PlaceExceptionHandler {

    @ExceptionHandler(PlaceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(PlaceNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidPlaceYouTubeUrlException.class)
    public ResponseEntity<ProblemDetail> handleInvalidYouTubeUrl(InvalidPlaceYouTubeUrlException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidPlaceImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidPlaceImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
