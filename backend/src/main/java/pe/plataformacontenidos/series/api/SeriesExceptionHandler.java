package pe.plataformacontenidos.series.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.series.EpisodeNotFoundException;
import pe.plataformacontenidos.series.InvalidSeriesInputException;
import pe.plataformacontenidos.series.PlaylistFeedException;
import pe.plataformacontenidos.series.SeriesNotFoundException;

@RestControllerAdvice
public class SeriesExceptionHandler {

    @ExceptionHandler({ SeriesNotFoundException.class, EpisodeNotFoundException.class })
    public ResponseEntity<ApiError> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler(InvalidSeriesInputException.class)
    public ResponseEntity<ApiError> handleInvalidInput(InvalidSeriesInputException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    /** Al crear: YouTube no respondió o la lista no existe. 502 = el problema está del lado de YouTube. */
    @ExceptionHandler(PlaylistFeedException.class)
    public ResponseEntity<ApiError> handleFeed(PlaylistFeedException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ApiError(Instant.now(), 502, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
