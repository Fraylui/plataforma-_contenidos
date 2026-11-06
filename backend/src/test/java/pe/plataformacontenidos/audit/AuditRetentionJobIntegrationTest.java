package pe.plataformacontenidos.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;

/** Ley 29733 (minimización) e ISO 27001 A.8.15: la auditoría guarda IP y correo, así que no se conserva para siempre. */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AuditRetentionJobIntegrationTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditRetentionJob job;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void purgesEventsOlderThanTheRetentionAndKeepsRecentOnes() {
        auditService.record("RETENTION_OLD", AuditResult.SUCCESS, null, "viejo@test", "test", "1", "10.0.0.1");
        auditService.record("RETENTION_RECENT", AuditResult.SUCCESS, null, "nuevo@test", "test", "2", "10.0.0.2");
        Instant longAgo = Instant.now().minus(job.retentionDays() + 5, ChronoUnit.DAYS);
        jdbc.update("UPDATE audit.audit_log SET occurred_at = ? WHERE action = 'RETENTION_OLD'", Timestamp.from(longAgo));

        long purged = job.purgeExpired();

        assertThat(purged).isGreaterThanOrEqualTo(1);
        assertThat(count("RETENTION_OLD")).isZero();
        assertThat(count("RETENTION_RECENT")).isEqualTo(1);
        // La purga misma queda auditada, con cuántos eventos borró.
        assertThat(count("AUDIT_RETENTION_PURGED")).isGreaterThanOrEqualTo(1);
    }

    private int count(String action) {
        return jdbc.queryForObject("SELECT count(*) FROM audit.audit_log WHERE action = ?", Integer.class, action);
    }
}
