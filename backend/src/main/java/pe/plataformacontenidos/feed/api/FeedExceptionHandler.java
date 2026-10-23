package pe.plataformacontenidos.feed.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.feed.InvalidFeedTypeException;

/**
 * Mismo patrón que el resto de módulos (ContentExceptionHandler, ...):
 * responde el error directamente. Un ResponseStatusException se reenviaba a
 * /error, que la seguridad no deja pasar, y el cliente recibía 403 en vez
 * del 400 real (los tests con MockMvc no lo veían: no hacen ese reenvío).
 * Un parámetro con un valor que no existe (type=FOO) lo responde
 * ApiExceptionHandler.
 */
@RestControllerAdvice(assignableTypes = FeedController.class)
public class FeedExceptionHandler {

    @ExceptionHandler(InvalidFeedTypeException.class)
    public ResponseEntity<ProblemDetail> handleInvalidType(InvalidFeedTypeException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
