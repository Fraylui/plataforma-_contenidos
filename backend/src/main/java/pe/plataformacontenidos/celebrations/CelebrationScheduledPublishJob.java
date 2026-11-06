package pe.plataformacontenidos.celebrations;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/**
 * Publica las fechas SCHEDULED cuya hora ya pasó (cada minuto, igual que
 * PlaceScheduledPublishJob) y, a las 00:01 de Lima y al arrancar, recalcula
 * cuándo toca cada fecha anual (las que terminaron pasan al año siguiente).
 */
@Component
public class CelebrationScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(CelebrationScheduledPublishJob.class);

    private final CelebrationRepository celebrationRepository;
    private final AuditService auditService;
    private final CelebrationService celebrationService;

    public CelebrationScheduledPublishJob(CelebrationRepository celebrationRepository, AuditService auditService,
            CelebrationService celebrationService) {
        this.celebrationRepository = celebrationRepository;
        this.auditService = auditService;
        this.celebrationService = celebrationService;
    }

    @Scheduled(cron = "0 1 0 * * *", zone = "${site.time-zone:America/Lima}")
    @EventListener(ApplicationReadyEvent.class)
    public void refreshYearlyDates() {
        int changed = celebrationService.refreshYearlyOccurrences();
        if (changed > 0) {
            log.info("Celebraciones: {} fechas anuales recalculadas", changed);
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueCelebrations() {
        List<Celebration> due = celebrationRepository.findByStatusAndScheduledAtBefore(PublicationStatus.SCHEDULED, Instant.now());
        for (Celebration celebration : due) {
            celebration.publishFromSchedule(Instant.now());
            celebrationRepository.save(celebration);
            auditService.record("CELEBRATION_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "celebration", celebration.getId().toString(), null);
            log.info("Celebración {} publicado automáticamente (programación cumplida)", celebration.getId());
        }
    }
}
