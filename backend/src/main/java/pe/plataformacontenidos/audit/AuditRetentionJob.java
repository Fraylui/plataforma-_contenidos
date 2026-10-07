package pe.plataformacontenidos.audit;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Retención de la auditoría (Ley 29733 de protección de datos personales:
 * no conservar datos más tiempo del necesario; ISO 27001 A.8.15: período de
 * retención definido). Cada evento guarda correo e IP de quien actuó, así
 * que no se acumula para siempre — tampoco llena el disco del VPS.
 *
 * Todos los días a las 03:30 borra lo anterior a AUDIT_RETENTION_DAYS (por
 * defecto 365) y deja constancia de la purga en la propia auditoría.
 */
@Component
public class AuditRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(AuditRetentionJob.class);

    private final AuditEventRepository repository;
    private final AuditService auditService;
    private final int retentionDays;

    public AuditRetentionJob(AuditEventRepository repository, AuditService auditService,
            @Value("${audit.retention-days:365}") int retentionDays) {
        this.repository = repository;
        this.auditService = auditService;
        this.retentionDays = retentionDays;
    }

    public int retentionDays() {
        return retentionDays;
    }

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public long purgeExpired() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        int purged = repository.purgeOlderThan(cutoff);
        if (purged > 0) {
            log.info("Auditoría: {} eventos anteriores a {} purgados (retención {} días)", purged, cutoff, retentionDays);
            auditService.record("AUDIT_RETENTION_PURGED", AuditResult.SUCCESS, null, null,
                    "audit", String.valueOf(purged), null);
        }
        return purged;
    }
}
