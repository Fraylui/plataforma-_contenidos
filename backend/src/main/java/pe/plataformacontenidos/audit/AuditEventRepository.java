package pe.plataformacontenidos.audit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.repository.Repository;

/**
 * Intencionalmente NO extiende JpaRepository/CrudRepository: el log de
 * auditoría es append-only (CONTEXTO.md 18/35.3). Solo se exponen guardar y
 * leer — nunca update ni delete, ni siquiera por accidente vía herencia.
 */
public interface AuditEventRepository extends Repository<AuditEvent, UUID> {

    AuditEvent save(AuditEvent event);

    Optional<AuditEvent> findById(UUID id);

    List<AuditEvent> findAll();
}
