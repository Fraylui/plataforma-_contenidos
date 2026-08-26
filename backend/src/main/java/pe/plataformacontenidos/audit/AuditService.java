package pe.plataformacontenidos.audit;

import java.util.UUID;
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
}
