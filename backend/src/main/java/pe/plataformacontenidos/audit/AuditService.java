package pe.plataformacontenidos.audit;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    public void record(String action, AuditResult result, UUID actorUserId, String actorEmail,
            String resourceType, String resourceId, String ipAddress) {
        AuditEvent event = AuditEvent.builder(action, result)
                .actor(actorUserId, actorEmail)
                .resource(resourceType, resourceId)
                .ipAddress(ipAddress)
                .build();
        repository.save(event);
    }

    /**
     * Búsqueda paginada para el panel admin (CONTEXTO.md secciones 18 y
     * 35.3, fase 1: "audit log de acciones administrativas"). Todos los
     * criterios son opcionales (null = sin filtrar); se combinan con AND.
     */
    public Page<AuditEvent> search(AuditSearchCriteria criteria, Pageable pageable) {
        return repository.findAll(toSpecification(criteria), pageable);
    }

    private Specification<AuditEvent> toSpecification(AuditSearchCriteria criteria) {
        return (root, query, cb) -> {
            var conjunction = cb.conjunction();
            if (criteria.actorEmail() != null && !criteria.actorEmail().isBlank()) {
                conjunction = cb.and(conjunction,
                        cb.like(cb.lower(root.get("actorEmail")), "%" + criteria.actorEmail().toLowerCase() + "%"));
            }
            if (criteria.action() != null && !criteria.action().isBlank()) {
                conjunction = cb.and(conjunction,
                        cb.like(cb.lower(root.get("action")), "%" + criteria.action().toLowerCase() + "%"));
            }
            if (criteria.resourceType() != null && !criteria.resourceType().isBlank()) {
                conjunction = cb.and(conjunction, cb.equal(root.get("resourceType"), criteria.resourceType()));
            }
            if (criteria.result() != null) {
                conjunction = cb.and(conjunction, cb.equal(root.get("result"), criteria.result().name()));
            }
            if (criteria.from() != null) {
                conjunction = cb.and(conjunction, cb.greaterThanOrEqualTo(root.get("occurredAt"), criteria.from()));
            }
            if (criteria.to() != null) {
                conjunction = cb.and(conjunction, cb.lessThanOrEqualTo(root.get("occurredAt"), criteria.to()));
            }
            return conjunction;
        };
    }

    public record AuditSearchCriteria(
            String actorEmail, String action, String resourceType, AuditResult result, Instant from, Instant to) {
    }
}
