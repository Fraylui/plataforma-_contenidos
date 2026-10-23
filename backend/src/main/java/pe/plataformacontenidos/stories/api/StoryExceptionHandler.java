package pe.plataformacontenidos.stories.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.stories.InvalidStoryException;
import pe.plataformacontenidos.stories.StoryNotFoundException;

@RestControllerAdvice
public class StoryExceptionHandler {

    @ExceptionHandler(StoryNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(StoryNotFoundException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidStoryException.class)
    public ResponseEntity<ProblemDetail> handleInvalid(InvalidStoryException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
