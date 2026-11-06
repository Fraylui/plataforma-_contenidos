package pe.plataformacontenidos.series.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.series.EpisodeNotFoundException;
import pe.plataformacontenidos.series.InvalidSeriesInputException;
import pe.plataformacontenidos.series.PlaylistFeedException;
import pe.plataformacontenidos.series.SeriesNotFoundException;

@RestControllerAdvice
public class SeriesExceptionHandler {

    @ExceptionHandler({ SeriesNotFoundException.class, EpisodeNotFoundException.class })
    public ResponseEntity<ProblemDetail> handleNotFound(RuntimeException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidSeriesInputException.class)
    public ResponseEntity<ProblemDetail> handleInvalidInput(InvalidSeriesInputException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Al crear: YouTube no respondió o la lista no existe. 502 = el problema está del lado de YouTube. */
    @ExceptionHandler(PlaylistFeedException.class)
    public ResponseEntity<ProblemDetail> handleFeed(PlaylistFeedException ex) {
        return Problems.of(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }
}
