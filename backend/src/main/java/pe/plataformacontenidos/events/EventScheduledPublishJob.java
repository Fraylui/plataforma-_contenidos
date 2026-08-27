package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica eventos SCHEDULED cuya fecha ya pasó. Corre cada minuto, igual que PlaceScheduledPublishJob. */
@Component
public class EventScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(EventScheduledPublishJob.class);

    private final EventRepository eventRepository;
    private final AuditService auditService;

    public EventScheduledPublishJob(EventRepository eventRepository, AuditService auditService) {
        this.eventRepository = eventRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueEvents() {
        List<Event> due = eventRepository.findByStatusAndScheduledAtBefore(EventStatus.SCHEDULED, Instant.now());
        for (Event event : due) {
            event.publishFromSchedule();
            eventRepository.save(event);
            auditService.record("EVENT_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "event", event.getId().toString(), null);
            log.info("Evento {} publicado automáticamente (programación cumplida)", event.getId());
        }
    }
}
