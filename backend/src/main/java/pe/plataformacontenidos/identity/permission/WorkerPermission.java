package pe.plataformacontenidos.identity.permission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.io.Serializable;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "worker_permissions", schema = "identity")
@IdClass(WorkerPermission.Key.class)
public class WorkerPermission implements Persistable<WorkerPermission.Key> {

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

    /**
     * La clave es asignada (usuario + módulo): sin esto, save() haría merge,
     * con un SELECT antes de cada INSERT. Las filas siempre se reemplazan
     * enteras (WorkerService), así que una nueva siempre es INSERT.
     */
    @Transient
    private boolean isNew = true;

    protected WorkerPermission() {
        // JPA
    }

    public WorkerPermission(UUID userId, Module module, AccessLevel level) {
        this.userId = userId;
        this.module = module;
        this.level = level;
    }

    @Override
    public Key getId() {
        return new Key(userId, module);
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        isNew = false;
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
