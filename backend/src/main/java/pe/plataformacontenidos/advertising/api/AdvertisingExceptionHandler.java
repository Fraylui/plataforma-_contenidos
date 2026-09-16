package pe.plataformacontenidos.advertising.api;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.advertising.AdPlacementKeyNotFoundException;
import pe.plataformacontenidos.advertising.AdPlacementNotFoundException;
import pe.plataformacontenidos.advertising.AdvertiserHasCampaignsException;
import pe.plataformacontenidos.advertising.AdvertiserNotFoundException;
import pe.plataformacontenidos.advertising.CampaignNotFoundException;
import pe.plataformacontenidos.advertising.DuplicateAdPlacementKeyException;
import pe.plataformacontenidos.advertising.InvalidCampaignAmountException;
import pe.plataformacontenidos.advertising.InvalidCampaignImageException;
import pe.plataformacontenidos.advertising.InvalidCampaignScheduleException;

@RestControllerAdvice
public class AdvertisingExceptionHandler {

    @ExceptionHandler({ AdPlacementNotFoundException.class, AdPlacementKeyNotFoundException.class,
            AdvertiserNotFoundException.class, CampaignNotFoundException.class })
    public ResponseEntity<ApiError> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(Instant.now(), 404, ex.getMessage()));
    }

    @ExceptionHandler({ DuplicateAdPlacementKeyException.class, AdvertiserHasCampaignsException.class })
    public ResponseEntity<ApiError> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, ex.getMessage()));
    }

    @ExceptionHandler({ InvalidCampaignImageException.class, InvalidCampaignScheduleException.class,
            InvalidCampaignAmountException.class })
    public ResponseEntity<ApiError> handleBadRequest(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(Instant.now(), 400, ex.getMessage()));
    }

    public record ApiError(Instant timestamp, int status, String message) {
    }
}
