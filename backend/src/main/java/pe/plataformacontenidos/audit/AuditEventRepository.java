package pe.plataformacontenidos.audit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.Repository;

/**
 * Intencionalmente NO extiende JpaRepository/CrudRepository: el log de
 * auditoría es append-only (CONTEXTO.md 18/35.3). Solo se exponen guardar y
 * leer — nunca update ni delete, ni siquiera por accidente vía herencia.
 *
 * JpaSpecificationExecutor habilita búsqueda paginada/filtrada por
 * Specification; Spring Data lo declara con métodos exclusivamente de
 * lectura (findOne/findAll/count/exists), así que sumarlo no reintroduce
 * update/delete.
 */
public interface AuditEventRepository
        extends Repository<AuditEvent, UUID>, JpaSpecificationExecutor<AuditEvent> {

    AuditEvent save(AuditEvent event);

    Optional<AuditEvent> findById(UUID id);

    List<AuditEvent> findAll();
}
