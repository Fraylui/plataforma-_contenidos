package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/**
 * Publica las fechas SCHEDULED cuya hora ya pasó (cada minuto, igual que
 * PlaceScheduledPublishJob) y, a las 00:01 de Lima, pasa al año siguiente
 * las fechas anuales cuyo día terminó.
 */
@Component
public class EventScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(EventScheduledPublishJob.class);

    private final EventRepository eventRepository;
    private final AuditService auditService;
    private final EventService eventService;

    public EventScheduledPublishJob(EventRepository eventRepository, AuditService auditService,
            EventService eventService) {
        this.eventRepository = eventRepository;
        this.auditService = auditService;
        this.eventService = eventService;
    }

    @Scheduled(cron = "0 1 0 * * *", zone = "${site.time-zone:America/Lima}")
    public void refreshYearlyDates() {
        int moved = eventService.refreshYearlyOccurrences();
        if (moved > 0) {
            log.info("Celebraciones: {} fechas anuales pasaron al año siguiente", moved);
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueEvents() {
        List<Event> due = eventRepository.findByStatusAndScheduledAtBefore(PublicationStatus.SCHEDULED, Instant.now());
        for (Event event : due) {
            event.publishFromSchedule(Instant.now());
            eventRepository.save(event);
            auditService.record("EVENT_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "event", event.getId().toString(), null);
            log.info("Evento {} publicado automáticamente (programación cumplida)", event.getId());
        }
    }
}
