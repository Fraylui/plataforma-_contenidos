package pe.plataformacontenidos.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Registro de auditoría, append-only por diseño (CONTEXTO.md secciones 18 y
 * 35.3): no se expone ningún método de actualización/borrado, solo creación
 * y lectura (ver AuditEventRepository).
 */
@Entity
@Table(name = "audit_log", schema = "audit")
public class AuditEvent {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt = Instant.now();

    @Column(name = "actor_user_id", updatable = false)
    private UUID actorUserId;

    @Column(name = "actor_email", updatable = false)
    private String actorEmail;

    @Column(nullable = false, updatable = false)
    private String action;

    @Column(name = "resource_type", updatable = false)
    private String resourceType;

    @Column(name = "resource_id", updatable = false)
    private String resourceId;

    @Column(name = "ip_address", updatable = false)
    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private String result;

    protected AuditEvent() {
        // JPA
    }

    private AuditEvent(Builder builder) {
        this.actorUserId = builder.actorUserId;
        this.actorEmail = builder.actorEmail;
        this.action = builder.action;
        this.resourceType = builder.resourceType;
        this.resourceId = builder.resourceId;
        this.ipAddress = builder.ipAddress;
        this.result = builder.result.name();
    }

    public static Builder builder(String action, AuditResult result) {
        return new Builder(action, result);
    }

    public static class Builder {
        private final String action;
        private final AuditResult result;
        private UUID actorUserId;
        private String actorEmail;
        private String resourceType;
        private String resourceId;
        private String ipAddress;

        private Builder(String action, AuditResult result) {
            this.action = action;
            this.result = result;
        }

        public Builder actor(UUID userId, String email) {
            this.actorUserId = userId;
            this.actorEmail = email;
            return this;
        }

        public Builder resource(String type, String id) {
            this.resourceType = type;
            this.resourceId = id;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public AuditEvent build() {
            return new AuditEvent(this);
        }
    }
}
