package pe.plataformacontenidos.advertising.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.advertising.AdPlacementKeyNotFoundException;
import pe.plataformacontenidos.advertising.AdPlacementNotFoundException;
import pe.plataformacontenidos.advertising.AdvertiserHasCampaignsException;
import pe.plataformacontenidos.advertising.AdvertiserNotFoundException;
import pe.plataformacontenidos.advertising.CampaignNotFoundException;
import pe.plataformacontenidos.advertising.DuplicateAdPlacementKeyException;
import pe.plataformacontenidos.advertising.InvalidAdvertiserLogoException;
import pe.plataformacontenidos.advertising.InvalidCampaignAmountException;
import pe.plataformacontenidos.advertising.InvalidCampaignFormatException;
import pe.plataformacontenidos.advertising.InvalidCampaignImageException;
import pe.plataformacontenidos.advertising.InvalidCampaignScheduleException;
import pe.plataformacontenidos.advertising.InvalidCampaignTargetingException;
import pe.plataformacontenidos.advertising.AdInventoryFullException;

@RestControllerAdvice
public class AdvertisingExceptionHandler {

    @ExceptionHandler({ AdPlacementNotFoundException.class, AdPlacementKeyNotFoundException.class,
            AdvertiserNotFoundException.class, CampaignNotFoundException.class })
    public ResponseEntity<ProblemDetail> handleNotFound(RuntimeException ex) {
        return Problems.of(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({ DuplicateAdPlacementKeyException.class, AdvertiserHasCampaignsException.class })
    public ResponseEntity<ProblemDetail> handleConflict(RuntimeException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler({ InvalidCampaignImageException.class, InvalidCampaignScheduleException.class,
            InvalidCampaignAmountException.class, InvalidCampaignTargetingException.class,
            InvalidCampaignFormatException.class, InvalidAdvertiserLogoException.class })
    public ResponseEntity<ProblemDetail> handleBadRequest(RuntimeException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(AdInventoryFullException.class)
    public ResponseEntity<ProblemDetail> handleInventoryFull(AdInventoryFullException ex) {
        return Problems.of(HttpStatus.CONFLICT, ex.getMessage());
    }
}
