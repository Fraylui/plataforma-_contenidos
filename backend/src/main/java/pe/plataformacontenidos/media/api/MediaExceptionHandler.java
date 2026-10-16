package pe.plataformacontenidos.media.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.media.ImageAccessDeniedException;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.InvalidImageException;
import pe.plataformacontenidos.media.TooManyUploadsException;

@RestControllerAdvice
public class MediaExceptionHandler {

    @ExceptionHandler(ImageNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(ImageNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ImageAccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(ImageAccessDeniedException ex) {
        return Problems.of(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(InvalidImageException.class)
    public ResponseEntity<ProblemDetail> handleInvalidImage(InvalidImageException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(TooManyUploadsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyUploads(TooManyUploadsException ex) {
        return Problems.of(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ProblemDetail> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return Problems.of(HttpStatus.PAYLOAD_TOO_LARGE, "El archivo excede el tamaño máximo permitido");
    }
}
