package pe.plataformacontenidos.identity.permission;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkerPermissionRepository extends JpaRepository<WorkerPermission, WorkerPermission.Key> {

    List<WorkerPermission> findByUserId(UUID userId);

    /** Un solo DELETE (el derivado deleteByUserId cargaba y borraba fila por fila). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from WorkerPermission p where p.userId = :userId")
    void deleteAllOfUser(@Param("userId") UUID userId);
}
