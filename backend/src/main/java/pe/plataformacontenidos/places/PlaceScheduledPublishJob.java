package pe.plataformacontenidos.places;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica lugares SCHEDULED cuya fecha ya pasó. Corre cada minuto, igual que ScheduledPublishJob (Content). */
@Component
public class PlaceScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(PlaceScheduledPublishJob.class);

    private final PlaceRepository placeRepository;
    private final AuditService auditService;

    public PlaceScheduledPublishJob(PlaceRepository placeRepository, AuditService auditService) {
        this.placeRepository = placeRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDuePlaces() {
        List<Place> due = placeRepository.findByStatusAndScheduledAtBefore(PlaceStatus.SCHEDULED, Instant.now());
        for (Place place : due) {
            place.publishFromSchedule();
            placeRepository.save(place);
            auditService.record("PLACE_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "place", place.getId().toString(), null);
            log.info("Lugar {} publicado automáticamente (programación cumplida)", place.getId());
        }
    }
}
