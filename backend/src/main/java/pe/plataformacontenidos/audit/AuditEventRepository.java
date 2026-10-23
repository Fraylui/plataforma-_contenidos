package pe.plataformacontenidos.audit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
 *
 * Única excepción, explícita: purgeOlderThan, la política de retención
 * (AuditRetentionJob). Borra solo por antigüedad, nunca un evento puntual.
 */
public interface AuditEventRepository
        extends Repository<AuditEvent, UUID>, JpaSpecificationExecutor<AuditEvent> {

    AuditEvent save(AuditEvent event);

    Optional<AuditEvent> findById(UUID id);

    List<AuditEvent> findAll();

    @Modifying
    @Query("DELETE FROM AuditEvent e WHERE e.occurredAt < :cutoff")
    int purgeOlderThan(@Param("cutoff") Instant cutoff);
}
