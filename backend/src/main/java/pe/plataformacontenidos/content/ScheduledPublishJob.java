package pe.plataformacontenidos.content;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/** Publica artículos SCHEDULED cuya fecha ya pasó. Corre cada minuto: es intencionalmente barato para el MVP. */
@Component
public class ScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishJob.class);

    private final PublicationRepository publicationRepository;
    private final AuditService auditService;

    public ScheduledPublishJob(PublicationRepository publicationRepository, AuditService auditService) {
        this.publicationRepository = publicationRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDuePublications() {
        List<Publication> due = publicationRepository.findByStatusAndScheduledAtBefore(PublicationStatus.SCHEDULED, Instant.now());
        for (Publication publication : due) {
            publication.publishFromSchedule(Instant.now());
            publicationRepository.save(publication);
            auditService.record("PUBLICATION_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "publication", publication.getId().toString(), null);
            log.info("Publicación {} publicada automáticamente (programación cumplida)", publication.getId());
        }
    }
}
