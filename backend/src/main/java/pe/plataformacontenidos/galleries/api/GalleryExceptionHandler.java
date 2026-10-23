package pe.plataformacontenidos.galleries.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.galleries.GalleryNotFoundException;
import pe.plataformacontenidos.galleries.InvalidGalleryImageCountException;
import pe.plataformacontenidos.galleries.InvalidGalleryImageException;

@RestControllerAdvice
public class GalleryExceptionHandler {

    @ExceptionHandler(GalleryNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(GalleryNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidGalleryImageCountException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImageCount(InvalidGalleryImageCountException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidGalleryImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidGalleryImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
