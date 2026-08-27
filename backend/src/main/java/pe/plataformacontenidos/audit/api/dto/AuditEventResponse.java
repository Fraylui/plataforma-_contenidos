package pe.plataformacontenidos.audit.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.audit.AuditEvent;

public record AuditEventResponse(
        UUID id,
        Instant occurredAt,
        UUID actorUserId,
        String actorEmail,
        String action,
        String resourceType,
        String resourceId,
        String ipAddress,
        String result) {

    public static AuditEventResponse from(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getOccurredAt(),
                event.getActorUserId(),
                event.getActorEmail(),
                event.getAction(),
                event.getResourceType(),
                event.getResourceId(),
                event.getIpAddress(),
                event.getResult());
    }
}
