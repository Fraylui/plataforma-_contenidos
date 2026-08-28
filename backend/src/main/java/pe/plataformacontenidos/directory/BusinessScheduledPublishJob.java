package pe.plataformacontenidos.directory;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica fichas de directorio SCHEDULED cuya fecha ya pasó. Corre cada minuto, igual que ReviewScheduledPublishJob. */
@Component
public class BusinessScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(BusinessScheduledPublishJob.class);

    private final BusinessRepository businessRepository;
    private final AuditService auditService;

    public BusinessScheduledPublishJob(BusinessRepository businessRepository, AuditService auditService) {
        this.businessRepository = businessRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueBusinesses() {
        List<Business> due =
                businessRepository.findByStatusAndScheduledAtBefore(BusinessStatus.SCHEDULED, Instant.now());
        for (Business business : due) {
            business.publishFromSchedule();
            businessRepository.save(business);
            auditService.record("BUSINESS_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "business", business.getId().toString(), null);
            log.info("Ficha de directorio {} publicada automáticamente (programación cumplida)", business.getId());
        }
    }
}
