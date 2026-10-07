package pe.plataformacontenidos.identity.permission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "worker_permissions", schema = "identity")
@IdClass(WorkerPermission.Key.class)
public class WorkerPermission {

    public record Key(UUID userId, Module module) implements Serializable {
        public Key() {
            this(null, null);
        }
    }

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Module module;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessLevel level;

    protected WorkerPermission() {
        // JPA
    }

    public WorkerPermission(UUID userId, Module module, AccessLevel level) {
        this.userId = userId;
        this.module = module;
        this.level = level;
    }

    public UUID getUserId() {
        return userId;
    }

    public Module getModule() {
        return module;
    }

    public AccessLevel getLevel() {
        return level;
    }
}
